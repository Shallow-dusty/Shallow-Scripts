import sys
import subprocess
import re
import time
import statistics
import platform
import argparse
from datetime import datetime

# 配置默认测试目标
DEFAULT_TARGETS = [
    "github.com",
    "google.com",
    "1.1.1.1",       # Cloudflare DNS (基准)
    "223.5.5.5"      # 阿里 DNS (国内基准)
]

def get_ping_command(host):
    """根据操作系统返回 ping 命令"""
    param = '-n' if platform.system().lower() == 'windows' else '-c'
    # Windows下 -w 指定超时(毫秒), Linux/Mac下 -W 指定超时(秒)
    timeout_param = '-w' if platform.system().lower() == 'windows' else '-W'
    timeout_val = '1000' if platform.system().lower() == 'windows' else '1'
    
    # 只需要 ping 1 次
    return ['ping', param, '1', timeout_param, timeout_val, host]

def parse_ping_output(output):
    """从 ping 输出中提取时间 (ms)"""
    # Windows: "time=24ms" or "时间=24ms"
    # Linux/Mac: "time=24.0 ms"
    match = re.search(r'(time|时间)[=<]\s*([\d\.]+)\s*ms', output, re.IGNORECASE)
    if match:
        return float(match.group(2))
    return None

def main():
    parser = argparse.ArgumentParser(description="简单的网络质量监控工具 (延迟 & 抖动)")
    parser.add_argument('targets', metavar='HOST', type=str, nargs='*', help='要测试的主机列表', default=DEFAULT_TARGETS)
    parser.add_argument('-c', '--count', type=int, default=10000, help='循环测试次数 (默认: 10000)')
    parser.add_argument('-i', '--interval', type=float, default=1.0, help='Ping 间隔秒数 (默认: 1.0)')
    
    args = parser.parse_args()
    targets = args.targets

    # 存储统计数据
    stats = {target: [] for target in targets}
    
    print(f"开始测试网络质量...")
    print(f"目标: {', '.join(targets)}")
    print(f"按 Ctrl+C 停止测试\n")

    print(f"{ 'Time':^10} | { 'Target':^20} | { 'Latency':^10} | { 'Avg':^10} | { 'Jitter (StdDev)':^15} | { 'Loss%':^8}")
    print("-" * 85)

    try:
        step = 0
        while step < args.count:
            step += 1
            results_to_print = []
            
            for target in targets:
                try:
                    # Windows 下 ping 输出编码通常是 GBK
                    cmd = get_ping_command(target)
                    # 使用 shell=True 在 Windows 上有时能避免找不到命令，但在 subprocess 中通常不推荐
                    # 这里为了兼容性直接调用，且处理编码错误
                    result = subprocess.run(
                        cmd, 
                        stdout=subprocess.PIPE, 
                        stderr=subprocess.PIPE
                    )
                    
                    try:
                        output = result.stdout.decode('gbk')
                    except UnicodeDecodeError:
                        output = result.stdout.decode('utf-8', errors='ignore')

                    latency = parse_ping_output(output)
                    
                    if latency is not None:
                        stats[target].append(latency)
                        current_status = "OK"
                    else:
                        stats[target].append(None) # 丢包
                        current_status = "Timeout"

                except Exception as e:
                    stats[target].append(None)
                    current_status = "Error"

                # 计算统计信息
                valid_pings = [x for x in stats[target] if x is not None]
                total_pings = len(stats[target])
                loss_rate = ((total_pings - len(valid_pings)) / total_pings) * 100
                
                if valid_pings:
                    avg_latency = statistics.mean(valid_pings)
                    # 抖动：这里使用标准差 (Standard Deviation)
                    if len(valid_pings) > 1:
                        jitter = statistics.stdev(valid_pings)
                    else:
                        jitter = 0.0
                    
                    current_disp = f"{latency:.1f} ms" if latency else "TIMEOUT"
                    
                    # 格式化输出行
                    print(f"{datetime.now().strftime('%H:%M:%S'):^10} | {target:^20} | {current_disp:^10} | {avg_latency:^10.1f} | {jitter:^15.2f} | {loss_rate:^8.1f}")
                else:
                    print(f"{datetime.now().strftime('%H:%M:%S'):^10} | {target:^20} | {'TIMEOUT':^10} | {'N/A':^10} | {'N/A':^15} | {loss_rate:^8.1f}")
            
            print("-" * 85)
            time.sleep(args.interval)

    except KeyboardInterrupt:
        print("\n\n测试停止。最终统计报告:")
        print("=" * 70)
        print(f"{ 'Target':^20} | { 'Sent':^6} | { 'Recv':^6} | { 'Loss%':^8} | { 'Avg (ms)':^10} | { 'Jitter':^10}")
        print("-" * 70)
        
        for target in targets:
            valid_pings = [x for x in stats[target] if x is not None]
            total = len(stats[target])
            recv = len(valid_pings)
            loss = ((total - recv) / total) * 100 if total > 0 else 0
            avg = statistics.mean(valid_pings) if valid_pings else 0
            jitter = statistics.stdev(valid_pings) if len(valid_pings) > 1 else 0
            
            print(f"{target:^20} | {total:^6} | {recv:^6} | {loss:^8.1f} | {avg:^10.1f} | {jitter:^10.2f}")
        print("=" * 70)

if __name__ == "__main__":
    main()
