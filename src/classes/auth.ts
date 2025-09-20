import { CognitoIdentityProviderClient, InitiateAuthCommand, RespondToAuthChallengeCommand } from "@aws-sdk/client-cognito-identity-provider";

export type CredentialsDTO = {
    accessToken: string
    idToken: string
    refreshToken?: string
    expiresIn: number
    tokenType: "Bearer"
}

// handle the trial of sign in and auto sign in
export async function handleTrial(command: InitiateAuthCommand, client: CognitoIdentityProviderClient): Promise<CredentialsDTO> {
    try {
        let response = await client.send(command);
        if (response.ChallengeName === "NEW_PASSWORD_REQUIRED" && response.Session) {
            console.info("Setting new password...")
            const resp = await client.send(new RespondToAuthChallengeCommand({
                ChallengeName: "NEW_PASSWORD_REQUIRED",
                ClientId: command.input.ClientId!,
                Session: response.Session,
                ChallengeResponses: {
                    USERNAME: command.input.AuthParameters!.USERNAME,
                    NEW_PASSWORD: command.input.AuthParameters!.PASSWORD
                }
            }));
            response = resp;
        }
        if (response.AuthenticationResult) {
            const authResult: CredentialsDTO = {
                accessToken: response.AuthenticationResult.AccessToken!,
                idToken: response.AuthenticationResult.IdToken!,
                refreshToken: response.AuthenticationResult.RefreshToken,
                expiresIn: response.AuthenticationResult.ExpiresIn!,
                tokenType: response.AuthenticationResult.TokenType as "Bearer"
            };
            if (!authResult.accessToken || !authResult.idToken) {
                throw new Error("Authentication tokens are missing in the response");
            }
            return authResult;
        }
        throw new Error("Response does not contain authentication results");
    } catch (error: any) {
        switch (error.name) {
            case "UserNotFoundException":
                throw new Error("User does not exist", { cause: { status: 404, reason: "The user with the provided username does not exist." } });
            case "UserNotConfirmedException":
                throw new Error("User not confirmed", { cause: { status: 403, reason: "The user has not completed the confirmation process." } });
            case "NotAuthorizedException":
                throw new Error("Incorrect username or password", { cause: { status: 401, reason: "The provided username or password is incorrect." } });
            default:
                throw new Error("Authentication failed", { cause: { status: 500, reason: error.message } });
        }
    }
}

// main functions

// sign in with username and password
export async function signIn(username: string, password: string): Promise<CredentialsDTO> {
    const clientId = process.env.CLIENT_ID || null;
    if (!clientId) {
        throw new Error("client id is not defined", { cause: { status: 500, reason: "Client ID is missing from environment variables." } });
    }
    const region = process.env.AWS_REGION || "ca-central-1";
    const client = new CognitoIdentityProviderClient({ region });
    const command = new InitiateAuthCommand({
        AuthFlow: "USER_PASSWORD_AUTH",
        ClientId: clientId,
        AuthParameters: {
            USERNAME: username,
            PASSWORD: password,
        }
    });
    return handleTrial(command, client);
}

// auto sign in with refresh token
export async function autoSignIn(refreshToken: string): Promise<CredentialsDTO> {
    const clientId = process.env.CLIENT_ID || null;
    if (!clientId) {
        throw new Error("client id is not defined", { cause: { status: 500, reason: "Client ID is missing from environment variables." } });
    }
    const region = process.env.AWS_REGION || "ca-central-1";
    const client = new CognitoIdentityProviderClient({ region });
    const command = new InitiateAuthCommand({
        AuthFlow: "REFRESH_TOKEN_AUTH",
        ClientId: clientId,
        AuthParameters: {
            REFRESH_TOKEN: refreshToken
        }
    });
    return handleTrial(command, client);
}

