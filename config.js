import Pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
 host: process.env.DATABASE_HOST, // Your RDS endpoint
  port: process.env.DATABASE_PORT,
  user: process.env.DATABASE_USER,  // Your username
  password: process.env.DATABASE_PASSWORD,  // Your password
  database: process.env.DATABASE_NAME,  // Your database name
  ssl: {
    rejectUnauthorized:false
}
};
const db = new Pg.Client(dbConfig);
// const db = new Pg.Client({
//   connectionString: 'postgresql://mahesh:i8hW0vNCuZan89BvMbzCAA@droll-egret-5007.7s5.aws-ap-south-1.cockroachlabs.cloud:26257/quiz?sslmode=verify-full',
//   // ssl: {
//   //   ca: fs.readFileSync(path.resolve(__dirname, 'path/to/your/cockroachdb-ca.crt')).toString(),
//   // },
// });
//console.log(db)
try{
  db.connect()
  console.log("Connected to PostgreSQL")
}catch(err){
  console.log("some erro occurs")
}


export default db;
