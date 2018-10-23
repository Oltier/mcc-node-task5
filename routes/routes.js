const express = require('express');
const router = express.Router();
const path = require('path');
const request = require('request');
const fs = require('fs');
const latex = require('node-latex');

const filesPath = path.join(__dirname, '..', 'files');

/* GET home page. */
router.get('/', function (req, res, next) {

    const url = req.query.url || null;

    if (!url) {
        return res.json({status: "failure"});
    }

    const texFile = fs.createWriteStream(path.join(filesPath, "sample.tex"));
    const pdfFile = fs.createWriteStream(path.join(filesPath, "final.pdf"));

    request
        .get(url)
        .on('response', (response) => {
            response.pipe(texFile);
            texFile.on('finish', () => {
                texFile.close(() => {
                    const input = fs.createReadStream(path.join(filesPath, "sample.tex"));
                    const pdf = latex(input);
                    pdf.pipe(pdfFile);
                    pdf.on('error', (err) => {
                        console.error(err);
                        fs.unlink(texFile);
                        fs.unlink(pdfFile);
                        return res.json({status: "failure"});
                    });
                    pdf.on('finish', () => {
                        res.json({status: 'success'});
                    })
                });
            });
            texFile.on('error', (err) => {
                console.error(err);
                fs.unlink(texFile);
                fs.unlink(pdfFile);
                return res.json({status: "failure"});
            })
        })
        .on('error', (err) => {
            fs.unlink(texFile);
            fs.unlink(pdfFile);
            console.error(err);
            return res.json({status: "failure"});
        });

});

module.exports = router;
