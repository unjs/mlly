// @ts-nocheck

async function test() {
  throw new Error("Something went wrong in eval-err module!");
}

await test();
