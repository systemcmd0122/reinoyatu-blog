import { searchBlogs } from "./actions/blog";

async function test() {
  const result = await searchBlogs("");
  console.log("Search results for empty string:", result);

  const result2 = await searchBlogs("test");
  console.log("Search results for 'test':", result2);
}

test();
