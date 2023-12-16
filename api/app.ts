import express from 'express';
import serverlessExpress from '@vendia/serverless-express';
import expressAsyncHandler from 'express-async-handler';
import { DynamoDBClient, PutItemCommand, ScanCommand , GetItemCommand} from '@aws-sdk/client-dynamodb';
import { v4 } from 'uuid';

const app = express();
const router = express.Router();


app.use(router);

app.get(
    '/task',
    expressAsyncHandler(async (req, res) => {
        const client = new DynamoDBClient({ region: 'eu-west-2' });
        const command = new ScanCommand({
            TableName: 'tasks',
        });

        try {
            const { Items } = await client.send(command);
            res.json({ tasks: Items });
        } catch (e) {
            res.status(500).json({ error: JSON.stringify(e) });
        }
    }),
);

app.get(
    '/task/:taskId',
    expressAsyncHandler(async (req, res) => {
        const { taskId } = req.params;

        if (!taskId) {
            res.status(400).json({ error: 'taskId is required in the request parameter' });
            return;
        }

        const client = new DynamoDBClient({ region: 'eu-west-2' });
        const command = new GetItemCommand({
            TableName: 'tasks',
            Key: {
                taskId: {
                    S: taskId,
                },
            },
        });
        try {
            await client.send(command);
            res.json({ message: 'Successful' });
        } catch (e) {
            res.json({ error: JSON.stringify(e) });
        }
    }),
);

app.post(
    '/task',
    expressAsyncHandler(async (req, res) => {
        const client = new DynamoDBClient({ region: 'eu-west-2' });
        const ID = v4();
        const command = new PutItemCommand({
            TableName: 'tasks',
            Item: {
                taskId: {
                    S: ID,
                },
                whatEverIWant: {
                    S: 'SOME RANDOM TEXT',
                },
            },
        });

        try {
            await client.send(command);
            res.json({ message: `Task with ID ${ID} created successfully` });
        } catch (e) {
            res.json({ error: JSON.stringify(e) });
        }
    }),
);



export const handler = serverlessExpress({ app });
