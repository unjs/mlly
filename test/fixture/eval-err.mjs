// @ts-nocheck
// eslint-disable-next-line require-await
async function test() {
  throw new Error("Something went wrong in eval-err module!");
}

await test();
