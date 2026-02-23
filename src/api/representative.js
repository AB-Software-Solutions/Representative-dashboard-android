import { get, patch } from "aws-amplify/api";

import { AMPLIFY_API } from "../config";

function buildQuery(params) {
  const sp = new URLSearchParams();
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    sp.append(k, String(v));
  });
  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}

export async function fetchRepresentativeVoters({
  page = 1,
  limit = 20,
  ...filters
}) {
  const qs = buildQuery({ page, limit, ...filters });
  const restOperation = get({
    apiName: AMPLIFY_API.apiName,
    // Representative "my voters" should be resolved server-side from the current user session
    // (no representativeId passed from the client).
    path: `/representatives/me/voters${qs}`,
  });

  const response = await restOperation.response;
  return response.body.json();
}

export async function fetchRepresentativeProfile({ representativeId }) {
  if (!representativeId) throw new Error("representativeId is required");

  const restOperation = get({
    apiName: AMPLIFY_API.apiName,
    path: `/representatives/${representativeId}`,
  });

  const response = await restOperation.response;
  return response.body.json();
}

export async function markVoterVoted({ voterId }) {
  if (!voterId) throw new Error("voterId is required");

  const restOperation = patch({
    apiName: AMPLIFY_API.apiName,
    path: `/voters/${voterId}/vote`,
  });

  const response = await restOperation.response;
  return response.body.json();
}

export async function fetchVoterById({ voterId }) {
  if (!voterId) throw new Error("voterId is required");

  const restOperation = get({
    apiName: AMPLIFY_API.apiName,
    path: `/voters/${voterId}`,
  });

  const response = await restOperation.response;
  return response.body.json();
}
