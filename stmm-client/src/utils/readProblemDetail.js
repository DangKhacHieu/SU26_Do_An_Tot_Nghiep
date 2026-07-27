export default async function readProblemDetail(response, fallback) {
  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    const problem = await response.json().catch(() => null);
    return problem?.detail || problem?.title || problem?.message || fallback;
  }

  const text = await response.text().catch(() => '');
  return text || fallback;
}
