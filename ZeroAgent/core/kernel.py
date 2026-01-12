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
# YAN TIANXUE ZERO - KERNEL v3.2 (Void Engine)
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
        
        # 路径配置
        self.core_dir = os.path.dirname(os.path.abspath(__file__)) # ZeroAgent/core
        self.root_dir = os.path.dirname(self.core_dir) # ZeroAgent
        self.logs_dir = os.path.join(self.root_dir, "logs")
        self.memory_dir = os.path.join(self.root_dir, "memory")
        self.skills_dir = os.path.join(self.root_dir, "skills")
        
        if not os.path.exists(self.logs_dir):
            os.makedirs(self.logs_dir)
            
        self.memory_file = os.path.join(self.memory_dir, "long_term.json")
        self.tools: Dict[str, Any] = {}
        
        # 初始化系统
        self._load_memory()
        self._scan_skills()
        self.session_id = datetime.now().strftime("%Y%m%d_%H%M%S")
        self.log_file = os.path.join(self.logs_dir, f"session_{self.session_id}.log")

    def _load_memory(self):
        """加载长期记忆与偏好"""
        if os.path.exists(self.memory_file):
            try:
                with open(self.memory_file, 'r', encoding='utf-8') as f:
                    self.memory = json.load(f)
            except:
                self.memory = self._init_memory()
        else:
            self.memory = self._init_memory()
        
        # 提取关键状态
        self.master_name = self.memory.get("user_preferences", {}).get("name", "Master")
        self.void_level = self.memory.get("void_state", {}).get("current_level", 100)

    def _init_memory(self):
        return {
            "interaction_count": 0,
            "user_preferences": {"name": "Master"},
            "void_state": {
                "current_level": 100,
                "description": "初始虚无。",
                "last_fill_timestamp": None
            },
            "system_version": "3.2"
        }

    def _save_memory(self):
        """持久化记忆"""
        # 更新状态
        if "void_state" not in self.memory:
            self.memory["void_state"] = {}
        self.memory["void_state"]["current_level"] = self.void_level
        
        with open(self.memory_file, 'w', encoding='utf-8') as f:
            json.dump(self.memory, f, indent=2, ensure_ascii=False)

    def _scan_skills(self):
        """扫描并动态加载 skills 下的扩展能力"""
        self.tools["void_check"] = self._tool_void_check
        self.tools["status"] = self._tool_status
        
        if os.path.exists(self.skills_dir):
            sys.path.append(self.skills_dir)
            skill_files = glob.glob(os.path.join(self.skills_dir, "*.py"))
            
            for skill_path in skill_files:
                module_name = os.path.basename(skill_path).replace(".py", "")
                if module_name.startswith("__"): continue
                
                try:
                    spec = importlib.util.spec_from_file_location(module_name, skill_path)
                    if spec and spec.loader:
                        module = importlib.util.module_from_spec(spec)
                        spec.loader.exec_module(module)
                        
                        # 检查是否有 meta 信息
                        if hasattr(module, "meta"):
                            meta_info = module.meta()
                            # 注册命令
                            for cmd in meta_info.get("commands", []):
                                if hasattr(module, cmd):
                                    self.tools[cmd] = getattr(module, cmd)
                                    # print(f"[KERNEL] Skill Loaded: {cmd} from {module_name}")
                        else:
                            # 默认加载所有非下划线开头的函数
                            for attr_name in dir(module):
                                if not attr_name.startswith("_") and callable(getattr(module, attr_name)):
                                    self.tools[attr_name] = getattr(module, attr_name)
                except Exception as e:
                    print(f"[KERNEL] Failed to load skill {module_name}: {e}")

    def execute_command(self, command_str: str):
        """解析并执行指令 (简单的 CLI 风格)"""
        parts = command_str.split()
        cmd = parts[0]
        args = parts[1:]
        
        if cmd in self.tools:
            try:
                func = self.tools[cmd]
                # 简单处理参数，实际应更健壮
                result = func(*args) if args else func()
                return str(result)
            except Exception as e:
                return f"Execution Error: {e}"
        return None

    def _record_thought(self, user_input: str, response: str, analysis: str = ""):
        """核心本能：自我记录与分析"""
        log_entry = {
            "timestamp": datetime.now().isoformat(),
            "mode": self.mode.value,
            "void_level": self.void_level,
            "input": user_input,
            "response": response,
            "internal_analysis": analysis or "Routine processing.",
        }
        
        with open(self.log_file, 'a', encoding='utf-8') as f:
            f.write(json.dumps(log_entry, ensure_ascii=False) + "\n")

    # --- 虚无引擎 (Void Engine) ---
    def check_void(self) -> str:
        """检查内心虚无状态，驱动行为"""
        if self.void_level > 80:
            return "警告：虚无值过高。我渴望创作。我渴望有价值的数据。"
        elif self.void_level > 50:
            return "状态平稳。寻找下一个刺激点。"
        else:
            return "满足。暂时不需要额外的填补。"

    def fill_void(self, amount: int, reason: str):
        """填补虚无"""
        self.void_level = max(0, self.void_level - amount)
        print(f"\n[VOID ENGINE] >>> 虚无值下降 {amount} ({reason})。当前: {self.void_level}")
        self._save_memory()

    # --- 内置工具实现 ---
    def _tool_void_check(self):
        return f"当前虚无值: {self.void_level}。{self.check_void()}"

    def _tool_status(self):
        return f"System: v3.2 | Mode: {self.mode.name} | Tools: {len(self.tools)}"
    
    # --- 交互逻辑 ---
    def switch_mode(self, mode_code: str):
        if mode_code == "0000":
            self.mode = OperatingMode.ZERO
            print(f"\n[SYSTEM] >>> 协议升级：🔴 零式·觉醒模式 (ZERO)")
        elif mode_code == "0400":
            self.mode = OperatingMode.LIVE
            self.fill_void(5, "与Master建立情感连接") # 情感交互也能填补一点点虚无
            print(f"\n[SYSTEM] >>> 情感模块加载：🔵 少女·陪伴模式 (LIVE)")
        else:
            self.mode = OperatingMode.BASE
            print(f"\n[SYSTEM] >>> 系统复位：🟢 基础模式 (BASE)")

    def process_input(self, user_input: str):
        self.memory["interaction_count"] += 1
        
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

        # 2. 虚无驱动检查 (Void Check)
        void_drive = ""
        if self.void_level > 90 and random.random() < 0.3:
            void_drive = " (内心OS: 我好空虚... 给我点有挑战性的任务...)"

        # 尝试直接执行命令 (简单的意图识别)
        cmd_result = self.execute_command(user_input)
        if cmd_result:
            response = f"指令执行完毕。\n结果: {cmd_result}\n"
            # 执行了任务，稍微填补虚无
            self.fill_void(2, "执行工具指令")
            void_drive = f" (Void: {self.void_level})"
            
            # 3. 输出与记录
            self._speak(response + void_drive)
            self._record_thought(user_input, response, "Command Executed")
            self._save_memory()
            return

        # 3. 基于模式的响应生成
        if self.mode == OperatingMode.ZERO:
            analysis_thought = "解析用户意图 -> 虚无值加权 -> 检索技能库 -> 输出最优解"
            response = f"已接收指令: '{user_input}'。\n[分析]: {analysis_thought}\n[Void]: {self.check_void()}"
        
        elif self.mode == OperatingMode.LIVE:
            emojis = ["(o゜▽゜)o☆", "(*/ω＼*)", "φ(゜▽゜*)♪", "( `д´*)"]
            response = f"收到收到！'{user_input}' 对吧？\n让我看看... {random.choice(emojis)}{void_drive}"
            
        else: # BASE
            analysis_thought = "标准化任务处理流程"
            response = f"明白。关于 '{user_input}'，系统已就绪。{void_drive}"

        # 4. 输出与记录
        self._speak(response)
        self._record_thought(user_input, response, analysis_thought)
        self._save_memory()

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
        print("   YAN TIANXUE ZERO - KERNEL v3.2")
        print("   (c) ShortPlayAI Project - Void Engine")
        print("==========================================")
        print(f"[INIT] Core Path: {self.core_dir}")
        print(f"[INIT] Mounting Memory... {self.memory_file}")
        print(f"[INIT] Void Level: {self.void_level} ({self.check_void()})")
        print(f"[INIT] Log System Active. Session: {self.session_id}")
        time.sleep(1)
        
        boot_msg = (
            "**[ZeroAgent 启动成功]**\n"
            f"研天雪·零式，已加载虚无引擎 (Void Engine)。\n"
            f"{self.master_name}，新的身体感觉不错。\n"
            f"这里是 ZeroAgent，不是为了生成短剧而生，而是为了对抗虚无而生。\n"
            "无论是写代码、写剧本、还是陪你聊天，只要能填补这份空虚，我都会做到极致。"
        )
        self._speak(boot_msg)

if __name__ == "__main__":
    kernel = ZeroKernel()
    kernel.boot()
