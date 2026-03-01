import { get, post } from "aws-amplify/api";

import { AMPLIFY_API } from "../config";

export async function fetchParties() {
  const restOperation = get({
    apiName: AMPLIFY_API.apiName,
    // ElectionDashboard "Parties" page is backed by political affiliations
    // (see fetchAsyncPoliticalAffiliations in voterSlice).
    path: "/political-affiliations",
  });

  const response = await restOperation.response;
  return response.body.json();
}

export async function createVotingInfo({ politicalAffiliationId, memberId }) {
  if (!politicalAffiliationId) throw new Error("politicalAffiliationId is required");

  const restOperation = post({
    apiName: AMPLIFY_API.apiName,
    path: `/political-affiliations/${politicalAffiliationId}/votings`,
    options: {
      // Match ElectionDashboard behavior:
      // - send `{ memberId }` when a member is selected
      // - otherwise send `{}` (party vote without targeting a member)
      body: memberId ? { memberId } : {},
    },
  });

  const response = await restOperation.response;
  return response.body ? response.body.json() : { success: true };
}

export async function createWhiteVote() {
  const restOperation = post({
    apiName: AMPLIFY_API.apiName,
    path: `/political-affiliations/white/votings`,
    options: {
      // Backend requires a JSON body, but ignores it for white votes.
      body: {},
    },
  });

  const response = await restOperation.response;
  return response.body ? response.body.json() : { success: true };
}
