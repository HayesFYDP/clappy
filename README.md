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

### Speech to Text/Text to Speech

You'll need to separately setup Whisper for transcription to work.

```
# first, clone the whisper.cpp repo into the empty whisper.cpp folder
git clone https://github.com/ggerganov/whisper.cpp.git
cd whisper.cpp

# download the model (for macOS)
sh ./models/download-ggml-model.sh base.en
# download the model (for Windows)
.\models\download-ggml-model.cmd base.en

# build the project (install cmake if you don't have it already)
cmake -B build
cmake --build build --config Release

# test transcribing an audio file (for macOS, not 100% sure if this is the right command)
./build/bin/whisper-cli -f samples/jfk.wav

# test transcribing an audio file (for Windows)
.\build\bin\Release\whisper-cli.exe -f samples/jfk.wav
```

You'll also need to install `sox` for audio recording to work.

```
# for macOS
brew install sox

# for Windows (requires Chocolatey)
choco install sox.portable
```

### Miscellaneous

Make sure to give VS Code accessibility access for window intervention to work (see `src/python_helper/README.md`)

To toggle the Clappy popup, use the keyboard shortcut `F8`.

---

### Troubleshooting

* If you get an error about some property not existing on type PrismaClient, you should run migrations and regenerate the prisma client:

  > npx prisma migrate deploy && npx prisma generate

* For window interventions to work on macOS, accessibility permission need to be enabled. See `src/python_helper/README.md` for more info.
