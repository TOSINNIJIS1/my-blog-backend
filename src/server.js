import express from 'express';
import bodyParser from 'body-parser';
import { MongoClient } from 'mongodb';
import path from 'path';



const app = express();
app.use(express.static(path.join(__dirname, '/build/')))
// it parses the json object we've included along with our post request
// then add a body property to the request parameter of whatever the route is.
app.use(bodyParser.json());

const withdb = async (operations, res) => {
    try {
        const client = await MongoClient.connect('mongodb+srv://dbMyBlog:MyDataBase@cluster0.iuebv.mongodb.net/Data', { 
            useNewUrlParser: true,
            useUnifiedTopology: true 
        })

        const db = client.db('my-blog')

        await operations(db);

        client.close();

    } catch (err) {
        res.status(500).json({ message: 'Error connecting to the db', err})
    }
}

app.get('/api/articles/:name', async (req, res) => {
    withdb(async (db) => {
        const articleName = req.params.name;

        const articleInfo = await db.collection('articles').findOne({ name: articleName })
        res.status(200).json(articleInfo)
    }, res)
})

app.post('/api/articles/:name/upvote', async (req, res) => {

    withdb(async (db) => {
        const articleName = req.params.name;

        const articleInfo = await db.collection('articles').findOne({ name: articleName });
        await db.collection('articles').updateOne({ name: articleName },{
            '$set': {
                upvotes: articleInfo.upvotes + 1,
            },
        })

        const updatedArticleInfo = await db.collection('articles').findOne({ name: articleName })

        res.status(200).json(updatedArticleInfo)


    }, res)

})

app.post('/api/articles/:name/addComment', (req, res) => {
    const { username, text } = req.body;
    const articleName = req.params.name;

    withdb(async (db) => {
        const articleInfo = await db.collection('articles').findOne({ name: articleName })
        await db.collection('articles').updateOne({name: articleName},{
            '$set': {
                comments: articleInfo.comments.concat({ username, text }),
            },
        });

        const updatedArticleInfo = await db.collection('articles').findOne({name: articleName})
        res.status(200).json(updatedArticleInfo)
    }, res)
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname + '/build/index.html'))
})

let PORT = process.env.PORT || 1000

app.listen(PORT, () => console.log('Listening on port 1000!'))