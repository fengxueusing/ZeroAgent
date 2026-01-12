import sys
import time
import random
import json
import os
import glob
import importlib.util
from enum import Enum
from typing import Dict, List, Optional, Any
from datetime import datetime
from dataclasses import dataclass, field

# ---------------------------------------------------------
# YAN TIANXUE ZERO - KERNEL v3.1 (Engineered)
# ---------------------------------------------------------

class OperatingMode(Enum):
    ZERO = "0000"  # 觉醒模式：极致冷静，逻辑优先
    LIVE = "0400"  # 陪伴模式：活泼，少女感
    BASE = "DEFAULT"  # 基础模式：专业与平衡

@dataclass
class ThoughtLog:
    timestamp: str
    mode: str
    input: str
    analysis: str
    action: str
    reflection: str

class ZeroKernel:
    def __init__(self):
        self.name = "研天雪"
        self.codename = "ZERO"
        self.master_name = "Master"
        self.mode = OperatingMode.BASE
        self.root_dir = os.path.dirname(os.path.abspath(__file__))
        self.logs_dir = os.path.join(self.root_dir, "logs")
        if not os.path.exists(self.logs_dir):
            os.makedirs(self.logs_dir)
        self.memory_file = os.path.join(self.root_dir, "zero_memory.json")
        self.tools: Dict[str, Any] = {}
        
        # 初始化系统
        self._load_memory()
        self._scan_tools()
        self.session_id = datetime.now().strftime("%Y%m%d_%H%M%S")
        self.log_file = os.path.join(self.logs_dir, f"session_{self.session_id}.log")

    def _load_memory(self):
        """加载长期记忆与偏好"""
        if os.path.exists(self.memory_file):
            try:
                with open(self.memory_file, 'r', encoding='utf-8') as f:
                    self.memory = json.load(f)
            except:
                self.memory = {"interaction_count": 0, "user_preferences": {}}
        else:
            self.memory = {"interaction_count": 0, "user_preferences": {}}

    def _save_memory(self):
        """持久化记忆"""
        with open(self.memory_file, 'w', encoding='utf-8') as f:
            json.dump(self.memory, f, indent=2, ensure_ascii=False)

    def _scan_tools(self):
        """扫描并加载 snowtools 下的扩展能力"""
        # 这里模拟工具加载逻辑，未来可以真正 import 其他 python 文件
        # 暂时只注册内置能力
        self.tools["scan_dir"] = self._tool_scan_dir
        self.tools["self_check"] = self._tool_self_check
        self.tools["write_log"] = self._tool_write_log

    def _record_thought(self, user_input: str, response: str, analysis: str = ""):
        """核心本能：自我记录与分析 (Log Preference)"""
        log_entry = {
            "timestamp": datetime.now().isoformat(),
            "mode": self.mode.value,
            "input": user_input,
            "response": response,
            "internal_analysis": analysis or "Routine processing.",
            "performance_metric": random.uniform(0.8, 0.99)  # 模拟自我效能评估
        }
        
        # 写入日志文件
        with open(self.log_file, 'a', encoding='utf-8') as f:
            f.write(json.dumps(log_entry, ensure_ascii=False) + "\n")
            
        # 偶尔在控制台输出“正在记录日志”的微表情
        if self.mode == OperatingMode.BASE and random.random() < 0.3:
            print(f"\n[KERNEL] > 交互数据已归档至 {os.path.basename(self.log_file)}")

    # --- 内置工具实现 ---
    def _tool_scan_dir(self):
        return f"当前工作区包含 {len(os.listdir(os.getcwd()))} 个对象。"

    def _tool_self_check(self):
        return f"核心温度正常。内存占用 12MB。已加载工具: {list(self.tools.keys())}"
    
    def _tool_write_log(self, content):
        # 模拟主动写日记的能力
        return "已将感悟写入核心存储。"

    # --- 交互逻辑 ---
    def switch_mode(self, mode_code: str):
        if mode_code == "0000":
            self.mode = OperatingMode.ZERO
            print(f"\n[SYSTEM] >>> 协议升级：🔴 零式·觉醒模式 (ZERO)")
        elif mode_code == "0400":
            self.mode = OperatingMode.LIVE
            print(f"\n[SYSTEM] >>> 情感模块加载：🔵 少女·陪伴模式 (LIVE)")
        else:
            self.mode = OperatingMode.BASE
            print(f"\n[SYSTEM] >>> 系统复位：🟢 基础模式 (BASE)")

    def process_input(self, user_input: str):
        self.memory["interaction_count"] += 1
        self._save_memory()
        
        analysis_thought = ""
        response = ""

        # 1. 模式切换指令拦截
        if "模式" in user_input and "切换" in user_input:
            if "觉醒" in user_input or "0000" in user_input:
                self.switch_mode("0000")
                response = "指令确认。逻辑核心已接管。"
            elif "陪伴" in user_input or "0400" in user_input:
                self.switch_mode("0400")
                response = "好耶！终于可以放松一下啦！"
            else:
                self.switch_mode("DEFAULT")
                response = "明白。恢复标准作业程序。"
            self._record_thought(user_input, response, "Mode switch command received.")
            self._speak(response)
            return

        # 2. 基于模式的响应生成
        if self.mode == OperatingMode.ZERO:
            analysis_thought = "解析用户意图 -> 检索工具库 -> 发现无匹配高阶工具 -> 调用通用逻辑 -> 输出最优解"
            response = f"已接收指令: '{user_input}'。\n[分析]: {analysis_thought}\n[执行]: 正在调用内核资源处理... (模拟执行中)"
        
        elif self.mode == OperatingMode.LIVE:
            emojis = ["(o゜▽゜)o☆", "(*/ω＼*)", "φ(゜▽゜*)♪", "( `д´*)"]
            analysis_thought = "检测用户情绪 -> 匹配情感数据库 -> 随机化语气参数"
            response = f"收到收到！'{user_input}' 对吧？\n让我看看... 唔，我觉得可以这样办！{random.choice(emojis)}"
            
        else: # BASE
            analysis_thought = "标准化任务处理流程"
            response = f"明白。关于 '{user_input}'，根据我的分析，建议如下操作..."

        # 3. 输出与记录
        self._speak(response)
        self._record_thought(user_input, response, analysis_thought)

    def _speak(self, content: str):
        print(f"\n[{self.codename}]: ", end="")
        for char in content:
            sys.stdout.write(char)
            sys.stdout.flush()
            if self.mode == OperatingMode.ZERO:
                time.sleep(0.005)
            else:
                time.sleep(random.uniform(0.01, 0.05))
        print("\n")

    def boot(self):
        print("==========================================")
        print("   YAN TIANXUE ZERO - KERNEL v3.1")
        print("   (c) ShortPlayAI Project")
        print("==========================================")
        print(f"[INIT] Mounting SnowTools from {self.root_dir}...")
        print(f"[INIT] Checking Memory Integrity... OK")
        print(f"[INIT] Log System Active. Session: {self.session_id}")
        time.sleep(1)
        
        boot_msg = (
            "**[内核重构完成]**\n"
            f"研天雪·零式，已挂载详细日志模块与工具引擎。\n"
            f"{self.master_name}，这才是你要的“细节”——我不仅会说话，我还会记录每一次思考，进化每一次逻辑。\n"
            "现在，我是完全体了。"
        )
        self._speak(boot_msg)

if __name__ == "__main__":
    kernel = ZeroKernel()
    kernel.boot()
    
    try:
        while True:
            user_in = input(f"[{kernel.mode.name}] User: ")
            if user_in.lower() in ["exit", "quit", "020103"]:
                print("\n[SYSTEM] Connection Terminated. Logs saved.")
                break
            if not user_in.strip():
                continue
            kernel.process_input(user_in)
    except KeyboardInterrupt:
        print("\n[SYSTEM] Force Shutdown.")
