import express from 'express';
import serverlessExpress from '@vendia/serverless-express';
import expressAsyncHandler from 'express-async-handler';

const app = express();
const router = express.Router();
app.use(router);

app.post(
    '/task',
    expressAsyncHandler(async (req, res) => {
        res.json({ message: 'hello world' });
    }),
);

export const handler = serverlessExpress({ app });
