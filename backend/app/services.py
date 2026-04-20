import base64
import json
import logging
import os
import urllib.error
import urllib.request
from abc import ABC, abstractmethod
from uuid import uuid4

from .models import InputMode, MoodResult, QuizOption


logger = logging.getLogger(__name__)


MOOD_PROFILES = {
    "怒": ("木", "青枝骤起", "气劲在上升，想把停滞直接打破", {"金": 24, "木": 86, "水": 30, "火": 58, "土": 22}),
    "喜": ("火", "晴焰微扬", "表达欲更亮，节奏更快", {"金": 26, "木": 46, "水": 28, "火": 88, "土": 34}),
    "思": ("土", "阴雾偏重", "思绪密集，轮廓偏缓", {"金": 32, "木": 28, "水": 54, "火": 24, "土": 82}),
    "忧": ("金", "冷雾微悬", "心事更细密，容易对未发生的事提前担心", {"金": 76, "木": 24, "水": 48, "火": 20, "土": 36}),
    "悲": ("金", "薄雾垂落", "心里偏软，适合慢下来照顾自己", {"金": 72, "木": 20, "水": 52, "火": 16, "土": 34}),
    "恐": ("水", "夜潮压境", "警觉升高，需要给自己一点缓冲", {"金": 34, "木": 24, "水": 88, "火": 18, "土": 28}),
    "惊": ("水", "雷纹乍起", "情绪容易被瞬间点亮或打断", {"金": 42, "木": 26, "水": 82, "火": 36, "土": 24}),
}

QUIZ_MOOD_KEYS = {
    "wood-nu": "怒",
    "fire-xi": "喜",
    "earth-si": "思",
    "metal-you": "忧",
    "metal-bei": "悲",
    "water-kong": "恐",
    "water-jing": "惊",
}


class QuizResourceStore:
    def __init__(self) -> None:
        self._options = [
            QuizOption(
                id="wood-nu",
                name="木·怒",
                caption="最近更容易憋不住火，想把卡住的事情立刻推开。",
                wuxing="木",
                accent="#39c86b",
                assetKey="/quiz/angry_wood.png",
            ),
            QuizOption(
                id="fire-xi",
                name="火·喜",
                caption="最近情绪偏亮，想分享、想靠近、想表达。",
                wuxing="火",
                accent="#f05a58",
                assetKey="/quiz/joy_fire.png",
            ),
            QuizOption(
                id="earth-si",
                name="土·思",
                caption="最近容易反复想事，心里有些放不下。",
                wuxing="土",
                accent="#efc34f",
                assetKey="/quiz/si_tu.png",
            ),
            QuizOption(
                id="metal-you",
                name="金·忧",
                caption="最近心里有一点闷，容易对细节反复担心。",
                wuxing="金",
                accent="#f1f4fb",
                assetKey="/quiz/worry_gold.png",
            ),
            QuizOption(
                id="metal-bei",
                name="金·悲",
                caption="最近更容易低落，许多话到了嘴边也慢下来。",
                wuxing="金",
                accent="#9fb4df",
                assetKey="/quiz/sadness_gold.png",
            ),
            QuizOption(
                id="water-kong",
                name="水·恐",
                caption="最近神经绷得更紧，对未知有些过度警觉。",
                wuxing="水",
                accent="#5ca6ff",
                assetKey="/quiz/fear_water.png",
            ),
            QuizOption(
                id="water-jing",
                name="水·惊",
                caption="最近更容易被突发变化打乱，心里会忽然一紧。",
                wuxing="水",
                accent="#8a6cff",
                assetKey="/quiz/shock_water.png",
            ),
        ]

    def list(self) -> list[QuizOption]:
        return self._options

    def get(self, option_id: str) -> QuizOption:
        for option in self._options:
            if option.id == option_id:
                return option
        return self._options[0]


class BaseMoodAnalyzer(ABC):
    @abstractmethod
    def analyze(self, payload: object) -> MoodResult:
        raise NotImplementedError

    def build_result(
        self,
        *,
        mode: InputMode,
        mood_key: str,
        title: str,
        subtitle: str,
        description: str,
        wuxing: str,
        radar: dict[str, int],
        mascot_id: str,
        tips: list[str],
    ) -> MoodResult:
        return MoodResult(
            id=f"mood_{uuid4().hex[:10]}",
            mode=mode,
            moodKey=mood_key,
            title=title,
            subtitle=subtitle,
            description=description,
            wuxing=wuxing,
            radar=radar,
            mascotId=mascot_id,
            tips=tips,
        )

    def build_profile_result(
        self,
        *,
        mode: InputMode,
        mood_key: str,
        description: str,
        mascot_id: str,
        tips: list[str],
    ) -> MoodResult:
        wuxing, title, subtitle, radar = MOOD_PROFILES.get(mood_key, MOOD_PROFILES["思"])
        return self.build_result(
            mode=mode,
            mood_key=mood_key if mood_key in MOOD_PROFILES else "思",
            title=title,
            subtitle=subtitle,
            description=description,
            wuxing=wuxing,
            radar=radar,
            mascot_id=mascot_id,
            tips=tips,
        )


class VoiceMoodAnalyzer(BaseMoodAnalyzer):
    def analyze(self, payload: object) -> MoodResult:
        audio_size = int(payload)
        intensity = min(92, 36 + audio_size % 48)
        return self.build_result(
            mode=InputMode.VOICE,
            mood_key="忧",
            title="流云将明",
            subtitle="语气里有回旋，说明情绪正在松动。",
            description="你今天更像是在整理心里的线头。先把想说的说出来，再决定接下来推哪一步，心象会从散雾转向可见的路。",
            wuxing="水",
            radar={"金": 42, "木": 55, "水": intensity, "火": 38, "土": 50},
            mascot_id="voice-water-placeholder",
            tips=["适合先表达，再决策", "适合轻对话，不适合硬推进", "先把一件事说清楚"],
        )


class FaceMoodAnalyzer(BaseMoodAnalyzer):
    def analyze(self, payload: object) -> MoodResult:
        image_size = int(payload)
        focus = min(94, 44 + image_size % 40)
        return self.build_result(
            mode=InputMode.FACE,
            mood_key="悲",
            title="光隙浮现",
            subtitle="神色偏专注，内在线条比较清晰。",
            description="这一刻你的注意力更靠近中心，没有太多分散噪声。适合做判断、收口和确认边界，把最重要的那件事先摆到前面。",
            wuxing="金",
            radar={"金": focus, "木": 40, "水": 46, "火": 34, "土": 52},
            mascot_id="face-metal-placeholder",
            tips=["适合做收束动作", "适合确认优先级", "今天可以少开分支"],
        )


class DashScopeAsrClient:
    def __init__(self) -> None:
        self.api_key = os.getenv("ASR_API_KEY") or os.getenv("LLM_API_KEY", "")
        self.model = os.getenv("ASR_MODEL", "qwen3-asr-flash")
        self.base_url = os.getenv("ASR_BASE_URL", os.getenv("LLM_BASE_URL", "https://dashscope.aliyuncs.com/compatible-mode/v1")).rstrip("/")

    def transcribe(self, audio: bytes) -> str:
        if not self.api_key:
            return ""

        payload = {
            "model": self.model,
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "input_audio",
                            "input_audio": {
                                "data": f"data:audio/webm;base64,{base64.b64encode(audio).decode('ascii')}",
                            },
                        },
                    ],
                },
            ],
            "asr_options": {
                "language": "zh",
                "enable_itn": True,
            },
        }
        request = urllib.request.Request(
            f"{self.base_url}/chat/completions",
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
            },
            method="POST",
        )
        with urllib.request.urlopen(request, timeout=25) as response:
            data = json.loads(response.read().decode("utf-8"))

        return self._extract_text(data)

    def _extract_text(self, data: object) -> str:
        if isinstance(data, dict):
            try:
                content = data["choices"][0]["message"]["content"]
                if isinstance(content, str):
                    return content
                return self._extract_text(content)
            except (KeyError, IndexError, TypeError):
                pass
            for key in ("text", "transcript", "sentence"):
                value = data.get(key)
                if isinstance(value, str) and value:
                    return value
            for key in ("output", "result", "results"):
                text = self._extract_text(data.get(key))
                if text:
                    return text
        if isinstance(data, list):
            return " ".join(text for item in data if (text := self._extract_text(item)))
        return ""


class LlmMoodAnalyzer(BaseMoodAnalyzer):
    def __init__(self, fallback: BaseMoodAnalyzer) -> None:
        self.fallback = fallback
        self.api_key = os.getenv("LLM_API_KEY", "")
        self.base_url = os.getenv("LLM_BASE_URL", "").rstrip("/")
        self.model = os.getenv("LLM_MODEL", "")
        self.asr = DashScopeAsrClient()

    def analyze(self, payload: object) -> MoodResult:
        if not self._enabled():
            return self._fallback(payload)

        try:
            if isinstance(payload, bytes):
                return self._analyze_bytes(payload)
            return self._fallback(payload)
        except (KeyError, TypeError, ValueError, urllib.error.URLError) as caught:
            logger.warning("LLM voice analysis failed: %s", caught)
            return self._fallback(payload)

    def _enabled(self) -> bool:
        return bool(self.api_key and self.base_url and self.model)

    def _analyze_bytes(self, payload: bytes) -> MoodResult:
        transcript = ""
        try:
            transcript = self.asr.transcribe(payload)
            if transcript:
                logger.info("ASR transcript length: %s", len(transcript))
            else:
                logger.warning("ASR returned empty transcript")
        except (KeyError, TypeError, ValueError, urllib.error.URLError) as caught:
            logger.warning("ASR failed: %s", caught)
            transcript = ""

        content = (
            "用户刚完成一段 5 到 7 秒的语音表达。"
            f"转写文本：{transcript}"
            "请根据文本判断此刻更接近哪一种情志。"
            "只能在以下七种情志里选一个：怒、喜、思、忧、悲、恐、惊。"
        ) if transcript else (
            "用户刚完成一段 5 到 7 秒的语音表达。"
            f"音频文件大小约 {len(payload)} 字节。"
            "只能在以下七种情志里选一个最接近的：怒、喜、思、忧、悲、恐、惊。"
        )
        return self._build_llm_result(
            mode=InputMode.VOICE,
            mood_key=self._complete_mood_key(
                [
                    {
                        "role": "user",
                        "content": content,
                    }
                ]
            ),
            fallback_description="用户刚完成一段短语音表达。请把它视为此刻情绪的入口，而不是确定诊断。",
        )

    def analyze_face(self, payload: bytes) -> MoodResult:
        if not self._enabled():
            return self._fallback(payload)

        try:
            image = base64.b64encode(payload).decode("ascii")
            mood_key = self._complete_mood_key(
                [
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": (
                                    "请只根据这张面部画面的表情氛围判断此刻更接近哪一种情志。"
                                    "不要识别身份、年龄、性别，不要做医学诊断。"
                                    "只能在以下七种情志里选一个：怒、喜、思、忧、悲、恐、惊。"
                                ),
                            },
                            {
                                "type": "image_url",
                                "image_url": {"url": f"data:image/png;base64,{image}"},
                            },
                        ],
                    }
                ]
            )
            return self._build_llm_result(
                mode=InputMode.FACE,
                mood_key=mood_key,
                fallback_description="我只根据当前画面的表情氛围做即时情志判断，不保存照片，也不识别身份。",
            )
        except (KeyError, TypeError, ValueError, urllib.error.URLError) as caught:
            logger.warning("LLM face analysis failed: %s", caught)
            return self._fallback(payload)

    def _fallback(self, payload: object) -> MoodResult:
        if isinstance(payload, bytes):
            return self.fallback.analyze(len(payload))
        return self.fallback.analyze(payload)

    def _complete_mood_key(self, messages: list[dict[str, object]]) -> str:
        payload = {
            "model": self.model,
            "messages": [
                {
                    "role": "system",
                    "content": (
                        "你是一个情志分类器。只输出 JSON，不要输出 Markdown。"
                        '格式必须是 {"moodKey":"怒|喜|思|忧|悲|恐|惊"}。'
                    ),
                },
                *messages,
            ],
            "temperature": 0.2,
        }
        request = urllib.request.Request(
            f"{self.base_url}/chat/completions",
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
            },
            method="POST",
        )
        with urllib.request.urlopen(request, timeout=18) as response:
            data = json.loads(response.read().decode("utf-8"))

        content = data["choices"][0]["message"]["content"]
        parsed = json.loads(self._extract_json(str(content)))
        mood_key = str(parsed["moodKey"])
        if mood_key not in MOOD_PROFILES:
            raise ValueError("Invalid moodKey")
        return mood_key

    def _extract_json(self, content: str) -> str:
        start = content.find("{")
        end = content.rfind("}")
        if start == -1 or end == -1 or end < start:
            raise ValueError("Missing JSON object")
        return content[start : end + 1]

    def _build_llm_result(self, *, mode: InputMode, mood_key: str, fallback_description: str) -> MoodResult:
        descriptions = {
            "怒": "此刻的情绪更像一股向外推开的力量，适合先承认不满，再决定要不要行动。",
            "喜": "此刻的情绪偏明亮，表达和靠近的意愿更强，可以把这份轻盈用于连接他人。",
            "思": "此刻的思绪比较密集，适合先把反复出现的问题写下来，再挑一件最小的事处理。",
            "忧": "此刻更容易提前担心细节，适合把不确定的事拆小，先确认一个边界。",
            "悲": "此刻的心绪偏柔软，适合放慢节奏，给自己一点被照顾的空间。",
            "恐": "此刻的警觉感偏高，适合先稳定身体感受，再处理外部问题。",
            "惊": "此刻像是被突然扰动了一下，适合先暂停几秒，等节奏重新落回身体里。",
        }
        return self.build_profile_result(
            mode=mode,
            mood_key=mood_key,
            description=descriptions.get(mood_key, fallback_description),
            mascot_id=f"llm-{mood_key}",
            tips=["这只是此刻情志，不代表整天", "先照顾身体感受，再处理问题", "可以稍后重新测一次对照变化"],
        )


class QuizMoodAnalyzer(BaseMoodAnalyzer):
    def __init__(self, store: QuizResourceStore) -> None:
        self.store = store

    def analyze(self, payload: object) -> MoodResult:
        selected = self.store.get(str(payload))
        presets = {
            "wood-nu": ("青枝骤起", "气劲在上升，想把停滞直接打破", {"金": 24, "木": 86, "水": 30, "火": 58, "土": 22}),
            "fire-xi": ("晴焰微扬", "表达欲更亮，节奏更快", {"金": 26, "木": 46, "水": 28, "火": 88, "土": 34}),
            "earth-si": ("阴雾偏重", "思绪密集，轮廓偏缓", {"金": 32, "木": 28, "水": 54, "火": 24, "土": 82}),
            "metal-you": ("冷雾微悬", "心事更细密，容易对未发生的事提前担心", {"金": 76, "木": 24, "水": 48, "火": 20, "土": 36}),
            "metal-bei": ("薄雾垂落", "心里偏软，适合慢下来照顾自己", {"金": 72, "木": 20, "水": 52, "火": 16, "土": 34}),
            "water-kong": ("夜潮压境", "警觉升高，需要给自己一点缓冲", {"金": 34, "木": 24, "水": 88, "火": 18, "土": 28}),
            "water-jing": ("雷纹乍起", "情绪容易被瞬间点亮或打断", {"金": 42, "木": 26, "水": 82, "火": 36, "土": 24}),
        }
        title, subtitle, radar = presets[selected.id]
        return self.build_result(
            mode=InputMode.QUIZ,
            mood_key=QUIZ_MOOD_KEYS[selected.id],
            title=title,
            subtitle=subtitle,
            description=f"你选中的角色是 {selected.name}。这代表你此刻更接近这种情志状态，确认后我会为你匹配相应的推荐和推理线索。",
            wuxing=selected.wuxing,
            radar=radar,
            mascot_id=selected.assetKey,
            tips=["确认后将为你匹配相应剧本", "情志只是此刻，不代表整天", "可以从结果页继续回看今天的心象"],
        )
