import express from 'express';
import {addquizname,addquestion_to_quiz, questionForonequiz,Questionbankname,GoToQuizSetUp,addSaveTimer,delete_quiz_setup,getSaveTimer,dashboardgetSaveTimer} from '../controllers/quizsetupController.js';

const router = express.Router();

router.post("/addquizname",addquizname);
router.get("/questionForonequiz",questionForonequiz);
router.post("/addquestion_to_quiz",addquestion_to_quiz);
router.post("/Questionbankname",Questionbankname);
router.post("/GoToQuizSetUp",GoToQuizSetUp);
router.post("/addSaveTimer",addSaveTimer);
router.post("/delete_quiz_setup",delete_quiz_setup);
router.get("/getSaveTimer",getSaveTimer);
router.get("/dashboardgetSaveTimer",dashboardgetSaveTimer)
// router.post("/updateTimer",updateTimer)

export default router;
