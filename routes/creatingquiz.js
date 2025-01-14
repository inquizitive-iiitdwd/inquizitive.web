import express from 'express';
import { uploadMediaQuestion,getQuestion,deleteQuestion,setQuizNameToFile,addMarks } from '../controllers/creatingquizcontroller.js';
import {authenticate_user} from '../middlewares/authMiddleware.js'

const router = express.Router();


router.post("/uploadMediaQuestion",uploadMediaQuestion);
router.get("/getQuestion",getQuestion);
router.post("/setQuizNameToFile",setQuizNameToFile)
router.post("/deletequestion",deleteQuestion)//use router.delete
router.post("/addMarks",addMarks)

export default router;
