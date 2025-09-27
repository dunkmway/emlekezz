Deno.serve(async (req) => {
  const data = {
    message: `Hello ${(await req.json()).name}!`,
  };

  return new Response(
    JSON.stringify(data),
    { headers: { "Content-Type": "application/json" } },
  );
});
