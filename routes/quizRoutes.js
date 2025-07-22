import express from "express";
import {
  getAllQuizzes,
  createQuiz,
  deleteQuiz,
  updateQuizTimer,
  getQuestionsForQuiz,
  addQuestionToQuiz,
  addMediaToQuestion,
  deleteQuestionFromQuiz,
  addMarks,
  getMarks,
  upload, // Multer instance
} from "../controllers/quizController.js";

const router = express.Router();

// Quiz Setup Routes
router.get("/", getAllQuizzes);
router.post("/", createQuiz);
router.delete("/:name", deleteQuiz);
router.put("/:name/timer", updateQuizTimer);

// Quiz Question Routes
router.get("/:quizName/questions", getQuestionsForQuiz);
router.post("/:quizName/questions", addQuestionToQuiz);
router.delete("/:quizName/questions/:questionId", deleteQuestionFromQuiz);

// Quiz Question Media Route
router.put(
  "/:quizName/questions/:questionId/media",
  upload.single("file"),
  addMediaToQuestion
);

// Quiz Marks Routes
router.get("/:quizName/marks", getMarks);
router.post("/marks", addMarks);

export default router;
