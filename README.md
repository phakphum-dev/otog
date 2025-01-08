<p align="center">
  <a href="https://otog.in.th">
    <img src="https://github.com/phakphum-dev/otog-frontend/raw/main/public/logo512.png" width="80" />
  </a>
</p>

<h1 align="center">One Tambon One Grader</h1>

### Become a god of competitive programming, code and create algorithms efficiently.

### http://beta.otog.in.th/

An online grader which was originally provided for POSN KKU center students but currently open for everybody.

## Original otog

This project is an upgrade version of

1. [otog.in.th](https://github.com/phakphum-dev/otog-frontend): The current version of polyrepo otog
2. [OTOG-next](https://github.com/karnjj/OTOG-next): The newer version of otog developed in Nextjs
3. [otog.org](https://github.com/phizaz/otog): The OG otog grader which is no longer maintained

## Running Locally

Make sure that you have `git`, `node`, `pnpm`, and `docker` installed

1. Install dependencies

```bash
pnpm i
```

2. Set up environment file, copy `.env.template` and rename to `.env`

```bash
cp .env.template .env
cp ./apps/api/.env.template ./apps/api/.env
```

3. Spin up the database using docker compose

```bash
docker compose -f docker-compose.dev.yml up -d
```

4. Run codegen

```bash
pnpm codegen
```

5. Start development server

```bash
pnpm dev
```

Open http://localhost:3000 with your browser to see the result.

## TODO

- [ ] Forgot Password
- [ ] Editorial Article
- [ ] Upload Library
- [ ] Multiple Testcase Detail

## Bug Report

If you have any issue, feel free to open a new one in the issue tab

## Contributing

Pull requests are welcome. : )
