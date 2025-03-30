require('dotenv').config();

const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const cors = require("cors");
const cloudinary = require("cloudinary").v2;
const npt = require("./Model");
const mode1 = require("./model1");
const model3=require("./Model3");
const jwt=require("jsonwebtoken")
const app = express();
app.use(cors());
app.use(express.json())
cloudinary.config({
  cloud_name: 'dddgtr1vn',
  api_key: '452848993391925',
  api_secret: 'xNNCNt4DY0VUu89xhWDe3CZGLkQ',
  secure: true,
});

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("DB connected successfully");
  })
  .catch(error => {
    console.error("DB connection error:", error);
  });

app.post("/post", upload.single('image'), async (req, res) => {
  console.log("Received file:", req.file);

  if (!req.file || req.file.size === 0) {
    return res.status(400).send("No file uploaded or empty file");
  }

  try {
    const result = await cloudinary.uploader.upload_stream(
      { resource_type: "auto" },
      (error, result) => {
        if (error) {
          console.error("Cloudinary upload error", error);
          return res.status(500).send("Error uploading image to Cloudinary");
        }

        const imageUrl = result.secure_url;
        const amn = new npt({ image: imageUrl, text: req.body.text, banner: imageUrl });
        amn.save()
          .then(() => {
            console.log("Image saved to DB:", amn);
            res.send("Image uploaded and saved to DB");
          })
          .catch(error => {
            console.log(error);
            res.status(500).send("Error saving to database");
          });
      }
    );

    result.end(req.file.buffer);
  } catch (error) {
    console.log(error);
    res.status(500).send("Error uploading image");
  }
});

app.post('/send', upload.fields([{ name: 'image' }, { name: 'banner' }]), async (req, res) => {
  try {
    if (!req.files || !req.files.image || !req.files.banner) {
      return res.status(400).send('Both image and banner files are required');
    }

    console.log("Received files:", req.files);

    const imageFile = req.files.image[0];
    const bannerFile = req.files.banner[0];

    if (!imageFile || !bannerFile) {
      return res.status(400).send('Missing image or banner file');
    }

    const uploadToCloudinary = (file) => {
      return new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { resource_type: 'auto' },
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result);
            }
          }
        ).end(file.buffer);
      });
    };

    const [imageResult, bannerResult] = await Promise.all([
      uploadToCloudinary(imageFile),
      uploadToCloudinary(bannerFile),
    ]);

    const imageUrl = imageResult.secure_url;
    const bannerUrl = bannerResult.secure_url;

    if (!imageUrl || !bannerUrl) {
      return res.status(500).send('Error: Both image and banner URLs are required.');
    }

    const newData = new mode1({ image: imageUrl, text: req.body.text, banner: bannerUrl,video:req.body.video });
    await newData.save();
    console.log('Data saved to DB');
    res.send('Data saved to DB');
  } catch (error) {
    console.error('Error uploading files:', error);
    res.status(500).send('Error uploading files');
  }
});

app.get("/", async (req, res) => {
  res.send("ok");
});

app.get('/item/:id', async (req, res) => {
  const id = req.params.id;
  try {
    const md = await mode1.findById(id);
    res.json(md);
  } catch (error) {
    console.log(error);
    res.status(500).send("Error fetching item");
  }
});
app.post('/create',async(req,res)=>{
  const{name,pass}=req.body
  console.log(name,pass)
  const ch=new model3({name,pass})
  try{
    await ch.save()
    console.log("account created")
    res.send("account created")
  }
  catch(error){
    console.log(error)
    
  }


})
app.post('/login1',async(req,res)=>{
  const {name,pass}=req.body
  const bk=await model3.findOne({name})
  if(pass==bk.pass){
  
    const bg=jwt.sign({name,pass},"12345Ha",{expiresIn:"1hr"})
    res.json({"token":bg})
    console.log(bg)
  }

  else{
    console.log("not found")
  }
})
const verifytoken=(req,res,next)=>{
  const token=req.header["authorization"]
  if(!token){
    res.send("no token")
  }
  jwt.verify(token,"1234Ha",)
}

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});