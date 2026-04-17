from abc import ABC, abstractmethod
from uuid import uuid4

from .models import InputMode, MoodResult, QuizOption


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
            title=title,
            subtitle=subtitle,
            description=description,
            wuxing=wuxing,
            radar=radar,
            mascotId=mascot_id,
            tips=tips,
        )


class VoiceMoodAnalyzer(BaseMoodAnalyzer):
    def analyze(self, payload: object) -> MoodResult:
        audio_size = int(payload)
        intensity = min(92, 36 + audio_size % 48)
        return self.build_result(
            mode=InputMode.VOICE,
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
            title="光隙浮现",
            subtitle="神色偏专注，内在线条比较清晰。",
            description="这一刻你的注意力更靠近中心，没有太多分散噪声。适合做判断、收口和确认边界，把最重要的那件事先摆到前面。",
            wuxing="金",
            radar={"金": focus, "木": 40, "水": 46, "火": 34, "土": 52},
            mascot_id="face-metal-placeholder",
            tips=["适合做收束动作", "适合确认优先级", "今天可以少开分支"],
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
            title=title,
            subtitle=subtitle,
            description=f"你选中的角色是 {selected.name}。这代表你此刻更接近这种情志状态，确认后我会为你匹配相应的推荐和推理线索。",
            wuxing=selected.wuxing,
            radar=radar,
            mascot_id=selected.assetKey,
            tips=["确认后将为你匹配相应剧本", "情志只是此刻，不代表整天", "可以从结果页继续回看今天的心象"],
        )
