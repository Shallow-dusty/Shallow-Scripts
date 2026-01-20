import time
import socket
import statistics
import argparse
from urllib.parse import urlparse
from datetime import datetime

# 默认测试目标 (URL)
DEFAULT_TARGETS = [
    "https://github.com",
    "https://www.google.com",
    "https://1.1.1.1",  # Cloudflare
    "https://www.baidu.com" # 国内基准
]

def tcp_ping(url, timeout=3):
    """
    测试 TCP 握手延迟 (Time to Connect)
    """
    parsed = urlparse(url)
    host = parsed.hostname
    port = parsed.port or (443 if parsed.scheme == 'https' else 80)
    
    start_time = time.time()
    try:
        # 创建 socket 连接
        sock = socket.create_connection((host, port), timeout=timeout)
        end_time = time.time()
        sock.close()
        return (end_time - start_time) * 1000  # 转换为 ms
    except socket.timeout:
        return None
    except Exception as e:
        # print(f"Error: {e}")
        return None

def main():
    parser = argparse.ArgumentParser(description="真实的 TCP/HTTP 网络质量监控工具")
    parser.add_argument('targets', metavar='URL', type=str, nargs='*', help='要测试的URL列表', default=DEFAULT_TARGETS)
    parser.add_argument('-c', '--count', type=int, default=10, help='循环测试次数 (默认: 10)')
    parser.add_argument('-i', '--interval', type=float, default=1.0, help='间隔秒数 (默认: 1.0)')
    
    args = parser.parse_args()
    targets = args.targets

    stats = {target: [] for target in targets}

    print(f"开始 TCP/HTTP 延迟测试...")
    print(f"目标: {', '.join(targets)}")
    print(f"注意: 这反映的是应用层/传输层的真实连接耗时")
    print("-" * 100)
    print(f"{ 'Time':^10} | {'Target':^25} | {'TCP Connect':^12} | {'Avg':^10} | {'Jitter':^10} | {'Loss%':^8}")
    print("-" * 100)

    try:
        step = 0
        while step < args.count:
            step += 1
            
            for target in targets:
                latency = tcp_ping(target)
                
                if latency is not None:
                    stats[target].append(latency)
                    disp_latency = f"{latency:.1f} ms"
                else:
                    stats[target].append(None)
                    disp_latency = "TIMEOUT"

                # 统计
                valid = [x for x in stats[target] if x is not None]
                total = len(stats[target])
                loss = ((total - len(valid)) / total) * 100
                
                if valid:
                    avg = statistics.mean(valid)
                    jitter = statistics.stdev(valid) if len(valid) > 1 else 0.0
                else:
                    avg = 0.0
                    jitter = 0.0

                print(f"{datetime.now().strftime('%H:%M:%S'):^10} | {target:^25} | {disp_latency:^12} | {avg:^10.1f} | {jitter:^10.1f} | {loss:^8.1f}")
            
            print("-" * 100)
            time.sleep(args.interval)

    except KeyboardInterrupt:
        print("\n测试停止")

if __name__ == "__main__":
    main()
