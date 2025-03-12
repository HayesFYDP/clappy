# Clappy

### Running the project locally


1. Create a `.env` file. You can use `.env.example` to help with this. Make sure the environment variables `DATABASE_URL` and `OPENAI_API_KEY` are set in your .env file. The database URL can be kept the same as the `.env.example` and the `OPENAI_API_KEY` can be obtained from team chats.

2. Install dependencies (both TypeScript and Python) with
```
npm i

pip install -r src/python_helper/requirements.txt
```

3. To initialize the database, run
```
npm run generate
```

4. To build the project, run
```
npm run build
```

5. To run the project, run
```
npm run start
```
Make sure to give VS Code accessibility access.

To toggle the Clappy popup, use the keyboard shortcut `F8`.
