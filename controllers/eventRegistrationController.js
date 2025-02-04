import db from "../config.js"
import {
  sendVerificationEmail,
  sendresetpassword,
} from "../services/emailService.js";

export const eventRegistration=async (req,res)=>{
  console.log("got it")
    const {teamLeaderName,teamLeaderId,leadMailId,
     teamName,MemberI ,MemberIid, MemberII, MemberIIid
    } = req.body.data;
 
 
    
    if(!teamLeaderName&&!teamLeaderId&&!leadMailId&&!
     teamName&&!MemberI &&!MemberIid&&! MemberII&&! MemberIIid){
 
        res.status(201).json({ok:false,RteamName:false,RmailID:false,RteamMates:false});
     }
 
    try{
 
      const RteamName = await db.query ('SELECT teamName from eventRegistration where teamName = $1',[teamName]);
      const RmailID= await db.query ('SELECT leadMailID from eventRegistration where leadMailID like $1',[leadMailId]);
     

 
      const Rteamlead = await db.query('SELECT * FROM eventRegistration WHERE memberIid=$1 or memberIIid=$1 or teamleaderId=$1',[teamLeaderId]);
      const RteammateI = await db.query('SELECT * FROM eventRegistration WHERE memberIid=$1 or memberIIid=$1 or teamleaderId=$1',[MemberIid]);
      const RteammateII = await db.query('SELECT * FROM eventRegistration WHERE memberIid=$1 or memberIIid=$1 or teamleaderId=$1',[MemberIIid]);
 

 
      if (RmailID.rows.length>0){
       res.status(201).json({ok:false,RteamName:false,RmailID:true,Rteamlead:false,RteamMates:false});
      }
 
      else if(RteamName.rows.length>0){ 
       res.status(201).json({ok:false,RteamName:true,RmailID:false,Rteamlead:false,RteamMates:false});
     }
      
      else if(Rteamlead.rows.length>0){
       res.status(201).json({ok:false,RteamName:false,RmailID:false,Rteamlead:true,RteamMates:false});
      }
      
      else if(RteammateI.rows.length>0 || RteammateII.rows.length>0){
       res.status(201).json({ok:false,RteamName:false,RmailID:false,Rteamlead:false,RteamMates:true});
      }
      
      else{
 
       
       await db.query(
         'INSERT INTO eventRegistration VALUES ($1,$2,$3,$4,$5,$6,$7,$8)'
       ,[teamLeaderName,teamLeaderId,leadMailId,
         teamName,MemberI ,MemberIid, MemberII, MemberIIid]);
       res.status(200).json({ok:true,RteamName:false,RmailID:false,RteamMates:false});
      
      }
     }
 
     catch(e){
       console.log(e);
     }
 
 };
 export const accessingquizroom = async (req, res) => {
  try {
    const { teamName,teamleademailid,attempts } = req.body.data;
    console.log(teamleademailid,"Accessing Quiz Room")
    // Check if the team lead email is registered for the event
    const result = await db.query(
      'SELECT * FROM eventregistration WHERE  leadmailid=$1',
      [teamleademailid]
    );
    console.log(result.rows[0])
    if (result.rows.length === 0) {
      console.log("You are not registered for the quiz");
      return res.status(400).json({ error: 'You are not registered' });
    }

    const dbTimestamp = result.rows[0].timestamp;
      if (dbTimestamp) {
      const currentTimei = new Date();
      const istTimei = new Date(currentTimei.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
     
      console.log(currentTimei)
      const timeDifference = (istTimei - dbTimestamp) / 1000 / 60; // Difference in minutes

      console.log(timeDifference)

      if (timeDifference <= 5) {
        console.log("You already have the code");
        return res.status(200).json({ ok:false,message: `It takes ${timeDifference} min to expire for the code` });
      }
    }
      const currentTime = new Date();
    const istTime = new Date(currentTime.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));


    // Generate a random 4-digit OTP (or any other logic you prefer)
    let otp = Math.floor(1000 + Math.random() * 9000);

    await sendVerificationEmail(teamleademailid, otp);
    // Update the team key in the quiz_setup table
    const updateResult = await db.query(
      'UPDATE eventregistration SET teamkey=$1 WHERE leadmailid=$2',
      [otp, teamleademailid]
    );
    console.log(updateResult.rowCount)
    if (updateResult.rowCount === 0) {
      console.log("No matching record found in eventregistration");
      return res.status(400).json({ error: 'Something went wrong, no matching record found' });
    }

    res.status(200).json({ error: 'Key is generated successfully', otp });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Something went wrong' });
  }
};
export const accessingquizroombykey = async (req, res) => {
  try {
    // Destructure the key from the request body
    const { key, } = req.body;

    // Query the database to find a matching record in the eventregistration table
    const result = await db.query(
      'SELECT * FROM eventregistration WHERE teamkey = $1',
      [key]
    );

    // Check if a record was found
    if (result.rows.length > 0) {
      console.log("Key found:", result.rows[0]);
      res.status(200).json(result.rows[0]);
    } else {
      console.log("No matching key found");
      res.status(404).json({ message: "No matching key found" });
    }
  } catch (error) {
    // Handle any errors that occur during the query
    console.error("Error accessing quiz room by key:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};




