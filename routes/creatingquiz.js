import express from 'express';
import { uploadMediaQuestion,getQuestion,deleteQuestion,setQuizNameToFile,addMarks,getMarks } from '../controllers/creatingquizcontroller.js';
import {authenticate_user} from '../middlewares/authMiddleware.js'

const router = express.Router();


router.post("/uploadMediaQuestion",uploadMediaQuestion);
router.get("/getQuestion",getQuestion);
router.post("/setQuizNameToFile",setQuizNameToFile)
router.post("/deletequestion",deleteQuestion)//use router.delete
router.post("/addMarks",addMarks)
router.get("/getMarks",getMarks)

export default router;
