namespace POSSystem.DTOs
{
    // Frontend sends the Google id_token after successful Google sign-in
    public class GoogleLoginDto
    {
        /// <summary>
        /// The id_token returned by Google after the user signs in.
        /// We verify this on the backend using Google's public keys.
        /// </summary>
        public string IdToken { get; set; } = string.Empty;

        /// <summary>
        /// Only needed when a NEW cashier registers via Google.
        /// This is the branch invite code so we know which branch to assign them to.
        /// Leave empty for Admin (company creation flow) or existing users (login).
        /// </summary>
        public string? InviteCode { get; set; }
    }

    // What we return after Google auth — same as normal auth response
    public class GoogleAuthResponseDto
    {
        public string  Token       { get; set; } = string.Empty;
        public string  Name        { get; set; } = string.Empty;
        public string  Email       { get; set; } = string.Empty;
        public string  Role        { get; set; } = string.Empty;
        public int     CompanyId   { get; set; }
        public string  CompanyName { get; set; } = string.Empty;
        public int?    BranchId    { get; set; }
        public string? BranchName  { get; set; }
        public bool    IsNewUser   { get; set; } // true = first time — FE can show welcome
        public bool    NeedsInviteCode { get; set; } // true = new user needs branch code
    }
}
