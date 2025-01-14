import { response } from "express";
import db from "../config.js";
import fs from "fs";
let quizName = null;
//const quizNameFilePath = "./quizname.txt";

const readquizname =async ()=>{
  try{
const response=await db.query("select quizName from tempFileI")
console.log("response tempFileI",response.rows[0].quizname)
quizName=await response.rows[0].quizname
console.log("quizname from tempfileI",quizName)
return response.rows[0].quizname
}catch(err){
  console.log(err)
}
}
// if (fs.existsSync(quizNameFilePath)) {
//   quizName = fs.readFileSync(quizNameFilePath, "utf8");
// }




const saveQuizNameToFile =async (name) => {
  //fs.writeFileSync(quizNameFilePath, name, "utf8");
  try{
    await db.query("UPDATE tempFileI SET quizName =$1 where flag1=$2",[name,100])
    //res.status(200).send('quiz name added in database')
  }catch(err){
    console.log(err)
  }
}

export const addquizname =async(req,res)=>{
  console.log("addquizname1",req.body.data.name);
  quizName = req.body.data.name;
  saveQuizNameToFile(quizName);
  try{
    const response = await db.query("INSERT INTO quiz_setup(name) VALUES ($1)", [req.body.data.name]);
    //console.log("addquizname",response.rows[0]);
    res.status(200).send('Data updated successfully');
  }catch(err){
    //console.log("your err is",err)
  }
  }

export const questionForonequiz=async(req,res)=>{
  quizName=await readquizname()
  console.log("questionforonequiz",quizName)
  try {
    const result = await db.query('SELECT * FROM quiz_question WHERE quizname=$1',[quizName]);
    console.log("questionforonequiz result",result.rows)
     res.json(result.rows);
    } catch (err) {
    console.error('Error getting questions:', err);
    res.status(500).json({ error: 'Failed to get questions' });
    }
}
  
export const addquestion_to_quiz = async (req, res) => {
  const quizName123 =await readquizname()
  console.log("quizName123",quizName123)
  const {
    questionId,
    question,
    options,
    answer,
    description,
    imgSrc,
  } = req.body.data;
  console.log(req.body.data);
  try {
    // Check if the question already exists in the quiz
    const result = await db.query(
      "SELECT question_id FROM quiz_question WHERE question_id = $1",
      [questionId]
    );

    if (result.rows.length === 0) {
      // If the question doesn't exist, insert it
      await db.query("INSERT INTO quiz_question (question_id) VALUES ($1)", [
        questionId,
      ]);
    }

    // Update or insert the question details
    await db.query(
      `UPDATE quiz_question 
       SET question = $1, options1 = $2, options2 = $3, options3 = $4, options4 = $5, answer = $6, description = $7, image = $8, quizname = $9 
       WHERE question_id = $10`,
      [
        question,
        options[0],
        options[1],
        options[2],
        options[3],
        answer,
        description,
        imgSrc,
        quizName123,
        questionId,
      ]
    );

    res.status(200).send("Data updated successfully");
  } catch (err) {
    console.error("Error updating question:", err);
    res.status(500).json({ error: "Failed to update question" });
  }
};
  

  export const Questionbankname= async(req,res)=>{
    console.log("addquiznameforquestionbank",req.body.data.name);
    const quizName2 = req.body.data.name;
    saveQuizNameToFile(quizName2);
    res.status(200).send('Data updated successfully');
    }
  
  
  
export const GoToQuizSetUp=async(req,res)=>{
    //console.log(req.body.data)
    const quizName = req.body.data;
  }
  
  export const addSaveTimer=async(req,res)=>{
    console.log("addSaveTimer",req.body)
    const {quizTime,quizDate}=req.body;

    await db.query("UPDATE quiz_setup SET time=$1, date=$2 WHERE name=$3",[quizTime,quizDate,quizName])
    res.status(200).send({quizTime,quizDate,quizName})
    }
    
    export const getSaveTimer=async(req,res)=>{
      try{
        const quizName1 =await readquizname();
        console.log("qizName1 getsavetime",quizName1)
        const result= await db.query("SELECT * FROM quiz_setup where name=$1",[quizName1]);
        res.status(200).json(result.rows);
      }catch(e){
        console.log(e)
      }
    }

    export const dashboardgetSaveTimer=async(req,res)=>{
        try{
          const result= await db.query("SELECT * FROM quiz_setup");
          console.log("dashboardgetSaveTimer",result.rows)
          res.status(200).json(result.rows);
        }catch(e){
          res.status(500).json("something went wrong")
        }
      
      }
    
    export const delete_quiz_setup=async(req,res)=>{
    console.log("deletequizname",req.body.data)
    try{
    await db.query("DELETE FROM quiz_setup WHERE name=$1",[req.body.data])
    await db.query("DELETE FROM quiz_question WHERE quizname=$1",[req.body.data])
    res.status(200)
    } catch (err) {
    console.error('Error getting questions:', err);
    res.status(500).json({ error: 'Failed to get questions' });
    }
    }



  // export const updateTimer=(req,res)=>{
  //   console.log("hello")
  //   }