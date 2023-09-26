FROM oven/bun:latest

WORKDIR /app

COPY package.json .
COPY bun.lockb .
COPY src/ src/

RUN bun install

EXPOSE 3000

ENTRYPOINT ["bun", "run"]
CMD ["src/index.ts"]