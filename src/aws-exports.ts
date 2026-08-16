const awsmobile: Record<string, any> = {
  "aws_project_region": "us-east-2",
  "aws_cognito_region": "us-east-2",
  "aws_user_pools_id": "us-east-2_pLrj1NgHI",
  "aws_user_pools_web_client_id": "3ik571j3u4o4sb13bo7n4o9822",
  "oauth": {
      "domain": "faith-hub-auth.auth.us-east-2.amazoncognito.com",
      "scope": [
          "email",
          "openid",
          "profile"
      ],
      "redirectSignIn": "http://localhost:5173/",
      "redirectSignOut": "http://localhost:5173/",
      "responseType": "code"
  },
  "federationTarget": "COGNITO_USER_POOLS",
  "aws_cognito_username_attributes": [
      "EMAIL"
  ],
  "aws_cognito_mfa_configuration": "OFF",
  "aws_cognito_mfa_types": [
      "SMS"
  ],
  "aws_cognito_password_protection_settings": {
      "passwordPolicyMinLength": 8,
      "passwordPolicyCharacters": []
  },
  "aws_cognito_verification_mechanisms": [
      "EMAIL"
  ]
};

awsmobile.oauth.domain = "us-east-2plrj1nghi.auth.us-east-2.amazoncognito.com";

export default awsmobile;
