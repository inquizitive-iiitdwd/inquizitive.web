import db from "../config.js";
import multer from "multer";
import { initializeApp } from "firebase/app";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

// --- Firebase and Multer Setup ---
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID,
};

initializeApp(firebaseConfig);
const firebaseStorage = getStorage();

const memoryStorage = multer.memoryStorage();
export const upload = multer({ storage: memoryStorage });


// --- Quiz Setup Endpoints ---

/** GET /api/quizzes - Fetches all quizzes for the AdminDashboard. */
export const getAllQuizzes = async (req, res) => {
  try {
    const result = await db.query("SELECT id, name, time, date, duration FROM quiz_setup ORDER BY id DESC");
    res.status(200).json(result.rows);
  } catch (e) {
    console.error("Error fetching all quizzes:", e);
    res.status(500).json({ error: "Server error while fetching quizzes." });
  }
};

/** POST /api/quizzes - Creates a new quiz. */
export const createQuiz = async (req, res) => {
  const { name } = req.body.data;
  if (!name) return res.status(400).json({ error: "Quiz name is required." });

  try {
    const result = await db.query("INSERT INTO quiz_setup(name) VALUES ($1) RETURNING *", [name]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: "A quiz with this name already exists." });
    console.error("Error creating quiz:", err);
    res.status(500).json({ error: "Failed to create quiz." });
  }
};

/** DELETE /api/quizzes/:name - Deletes a quiz and all its questions. */
export const deleteQuiz = async (req, res) => {
  const { name } = req.params;
  try {
    await db.query('BEGIN');
    await db.query("DELETE FROM quiz_question WHERE quizname=$1", [name]);
    await db.query("DELETE FROM quiz_setup WHERE name=$1", [name]);
    await db.query('COMMIT');
    res.status(204).send();
  } catch (err) {
    await db.query('ROLLBACK');
    console.error('Error deleting quiz:', err);
    res.status(500).json({ error: 'Failed to delete quiz.' });
  }
};

/** PUT /api/quizzes/:name/timer - Updates timer details for a quiz. */
export const updateQuizTimer = async (req, res) => {
  const { name } = req.params;
  const { quizDate, quizTime, quizDuration } = req.body;
  try {
    const result = await db.query(
      "UPDATE quiz_setup SET date=$1, time=$2, duration=$3 WHERE name=$4 RETURNING *",
      [quizDate, quizTime, quizDuration, name]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: "Quiz not found." });
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error('Error updating quiz timer:', err);
    res.status(500).json({ error: 'Failed to update timer.' });
  }
};


// --- Quiz Question Endpoints ---

/** GET /api/quizzes/:quizName/questions - Gets all questions for a specific quiz. */
export const getQuestionsForQuiz = async (req, res) => {
  const { quizName } = req.params;
  try {
    const result = await db.query('SELECT * FROM quiz_question WHERE quizname=$1 ORDER BY question_id', [quizName]);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Error getting questions:', err);
    res.status(500).json({ error: 'Failed to get questions' });
  }
};

/** POST /api/quizzes/:quizName/questions - Adds a new question to a specific quiz. */
export const addQuestionToQuiz = async (req, res) => {
  const { quizName } = req.params;
  const { questionId, question, options, answer, description, imgSrc, marks, negativeMarks, questionType } = req.body.data;
  try {
    const newQuestion = await db.query(
      `INSERT INTO quiz_question (question_id, question, options1, options2, options3, options4, answer, description, image, quizname, marks, negativeMarks, questiontype) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *`,
      [questionId, question, options[0], options[1], options[2], options[3], answer, description, imgSrc, quizName, marks, negativeMarks, questionType]
    );
    res.status(201).json(newQuestion.rows[0]);
  } catch (err) {
    console.error("Error adding question:", err);
    res.status(500).json({ error: "Failed to add question" });
  }
};

/** PUT /api/quizzes/:quizName/questions/:questionId/media - Uploads and attaches media to a question. */
export const addMediaToQuestion = async (req, res) => {
    const { quizName, questionId } = req.params;
    const { mediaType } = req.body;
    const file = req.file;
  
    if (!file) return res.status(400).json({ error: 'No file uploaded.' });
    if (!mediaType || !['image', 'audio', 'video'].includes(mediaType)) {
        return res.status(400).json({ error: 'Invalid or missing mediaType.' });
    }
  
    try {
      const fileExtension = file.originalname.split('.').pop();
      const fileName = `${quizName}-${questionId}-${Date.now()}.${fileExtension}`;
      const storageRef = ref(firebaseStorage, `${mediaType}/${fileName}`);
  
      await uploadBytes(storageRef, file.buffer);
      const fileUrl = await getDownloadURL(storageRef);
      
      const result = await db.query(
        'UPDATE quiz_question SET file_type=$1, file_url=$2 WHERE question_id=$3 AND quizname=$4 RETURNING *', 
        [mediaType, fileUrl, questionId, quizName]
      );
  
      if (result.rowCount === 0) return res.status(404).json({ error: 'Question not found.' });
  
      res.status(200).json({ message: 'File uploaded successfully.', updatedQuestion: result.rows[0] });
    } catch (err) {
      console.error('Error uploading file:', err);
      res.status(500).json({ error: 'Error uploading file.' });
    }
};

/** DELETE /api/quizzes/:quizName/questions/:questionId - Deletes a single question from a quiz. */
export const deleteQuestionFromQuiz = async (req, res) => {
  const { quizName, questionId } = req.params;
  try {
    const result = await db.query("DELETE FROM quiz_question WHERE question_id = $1 AND quizname = $2", [questionId, quizName]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Question not found.' });
    res.status(200).json({ message: 'Question deleted successfully' });
  } catch (err) {
    console.error('Error deleting question:', err);
    res.status(500).json({ error: 'Failed to delete question' });
  }
};

// --- Quiz Marks Endpoints ---

/** POST /api/quizzes/marks - Adds a user's quiz score. */
export const addMarks = async (req, res) => {
    const { marks, roomKey, quizName, timestamp } = req.body.data;
    // Further logic for addMarks...
};

/** GET /api/quizzes/:quizName/marks - Retrieves all scores for a quiz. */
export const getMarks = async (req, res) => {
    const { quizName } = req.params;
    // Further logic for getMarks...
};