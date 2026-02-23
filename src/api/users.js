import { get } from "aws-amplify/api";

import { AMPLIFY_API } from "../config";

// Mirrors ElectionDashboard/src/redux/features/common/commonApi.js#getLoggedUser
export async function getUserByEmail() {
  const restOperation = get({
    apiName: AMPLIFY_API.apiName,
    path: "/users/email",
  });

  const response = await restOperation.response;
  return response.body.json();
}

