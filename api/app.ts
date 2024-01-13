import express from 'express';
import serverlessExpress, { getCurrentInvoke } from '@vendia/serverless-express';
import expressAsyncHandler from 'express-async-handler';
import {
    DynamoDBClient,
    PutItemCommand,
    ScanCommand,
    GetItemCommand,
    UpdateItemCommand,
} from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';

import { v4 } from 'uuid';
import cors from 'cors';
const app = express();
const router = express.Router();
import bodyParser from 'body-parser';

app.use(cors());
app.use(router);
app.use(bodyParser.json());

app.get(
    '/task',
    expressAsyncHandler(async (req, res) => {
        const client = new DynamoDBClient({ region: 'eu-west-2' });
        const command = new ScanCommand({
            TableName: 'tasks',
        });

        try {
            const { Items } = await client.send(command);

            const tasks = Items?.map((item) => unmarshall(item));
            res.json({ tasks });
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
    '/task/:taskId/compete',
    expressAsyncHandler(async (req, res) => {
        const { taskId } = req.params;

        if (!taskId) {
            res.status(400).json({ error: 'taskId is required in the request parameter' });
            return;
        }

        const client = new DynamoDBClient({ region: 'eu-west-2' });
        const command = new UpdateItemCommand({
            TableName: 'tasks',
            Key: {
                taskId: {
                    S: taskId,
                },
            },
            UpdateExpression: 'set endTime = :endTime',
            ExpressionAttributeValues: {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                //@ts-ignore
                ':endTime': Math.floor(Date.now() / 1000).toString(),
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
    '/tasks',
    expressAsyncHandler(async (req, res) => {
        const client = new DynamoDBClient({ region: 'eu-west-2' });
        const ID = v4();
        const { event } = getCurrentInvoke();
        const userId = event['requestContext']?.authorizer?.claims['cognito:username'];

        const command = new PutItemCommand({
            TableName: 'tasks',
            Item: {
                taskId: {
                    S: ID,
                },
                taskName: {
                    S: req.body.taskName,
                },
                startTime: {
                    S: req.body.startTime || Math.floor(Date.now() / 1000).toString(),
                },
                userid: {
                    S: userId,
                },
            },
        });

        try {
            await client.send(command);
            res.json({ message: `Task with ID ${ID} created successfully` });
        } catch (e) {
            console.log(e);
            res.json({ error: JSON.stringify(e) });
        }
    }),
);

export const handler = serverlessExpress({ app });
