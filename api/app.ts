import express from 'express';
import serverlessExpress, { getCurrentInvoke } from '@vendia/serverless-express';
import expressAsyncHandler from 'express-async-handler';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { v4 } from 'uuid';
import { request } from 'http';
// import serverlessExpress, { getCurrentInvoke } from '@vendia/serverless-express';

const app = express();
const router = express.Router();
app.use(router);

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
                taskName:{
                    S: req.body.taskName,
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
            res.json({ error: JSON.stringify(e) });
        }
    }),
);

export const handler = serverlessExpress({ app });
