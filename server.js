const express = require('express');
const multer = require('multer');
const clarifai = require('clarifai');
const { Telegraf } = require('telegraf');
const axios = require('axios');

const app = express();
const port = process.env.PORT || 3000;

const clarifaiapp = new clarifai.App({
    apiKey : '0652cba0c5514e1293dcef307ff82578'
});

const picstorage = multer.memoryStorage();
const uploadpics = multer({ storage : picstorage });

const bot = new Telegraf('7072969748:AAFcmHjJEOG5sPnOQR9W5N93k3ekafeR_7c');

//middleware

bot.on('photo',async(ctx)=>{
    try{
        const fileId = ctx.message.photo.pop().file_id;
        const fileurl = await ctx.telegram.getFileLink(fileId);

        const reply = await axios.get(fileurl.href , { responseType : 'arraybuffer' });
        const image = Buffer.from(reply.data).toString('base64');

        const clarifaireply = await  clarifaiapp.models.predict('e9576d86d2004ed1a38ba0cf39ecb4b1',{base64 : image});

        console.log('Clarifai Response:', clarifaireply); 
        
        const concepts = clarifaireply.outputs[0].data.concepts;
        console.log('Concepts:', concepts);
        const wrongcontent = concepts.some(concept =>  (concept.name === 'nsfw' && concept.value > 0.8));

        if(wrongcontent){
            ctx.reply('Warning: Inappropriate Content Detected. Actions will be taken.');
        }else{
            ctx.reply('Image is safe.');
        }
    }catch(error){
        ctx.reply('image cannot be read.ERROR');
        console.error(error);
    }
});

bot.launch();

app.listen(port,()=>{
    console.log('project running on http://localhost:3000');
});
