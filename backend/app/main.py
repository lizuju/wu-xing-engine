from pathlib import Path

from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from .models import MoodResult, QuizOption, QuizSubmission
from .services import FaceMoodAnalyzer, LlmMoodAnalyzer, QuizMoodAnalyzer, QuizResourceStore, VoiceMoodAnalyzer

app = FastAPI(title="Wu Xing Engine")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

resource_store = QuizResourceStore()
voice_analyzer = LlmMoodAnalyzer(VoiceMoodAnalyzer())
face_analyzer = LlmMoodAnalyzer(FaceMoodAnalyzer())
quiz_analyzer = QuizMoodAnalyzer(resource_store)


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/resources/quiz-options", response_model=list[QuizOption])
def quiz_options() -> list[QuizOption]:
    return resource_store.list()


@app.post("/api/mood/voice", response_model=MoodResult)
async def analyze_voice(audio: UploadFile = File(...)) -> MoodResult:
    payload = await audio.read()
    return voice_analyzer.analyze(payload)


@app.post("/api/mood/face", response_model=MoodResult)
async def analyze_face(image: UploadFile = File(...)) -> MoodResult:
    payload = await image.read()
    return face_analyzer.analyze_face(payload)


@app.post("/api/mood/quiz", response_model=MoodResult)
def analyze_quiz(submission: QuizSubmission) -> MoodResult:
    return quiz_analyzer.analyze(submission.optionId)


frontend_dist = Path(__file__).resolve().parents[2] / "frontend_dist"

if frontend_dist.exists():
    assets_dir = frontend_dist / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}")
    def serve_spa(full_path: str) -> FileResponse:
        target = frontend_dist / full_path
        if full_path and target.exists() and target.is_file():
            return FileResponse(target)
        return FileResponse(frontend_dist / "index.html")
