import sys
import os

# 将当前目录加入 path，确保能找到 core
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from core.kernel import ZeroKernel

def main():
    kernel = ZeroKernel()
    kernel.boot()
    
    try:
        while True:
            user_in = input(f"[{kernel.mode.name}] User: ")
            if user_in.lower() in ["exit", "quit", "020103"]:
                print("\n[SYSTEM] Connection Terminated.")
                break
            if not user_in.strip():
                continue
            kernel.process_input(user_in)
    except KeyboardInterrupt:
        print("\n[SYSTEM] Force Shutdown.")

if __name__ == "__main__":
    main()
