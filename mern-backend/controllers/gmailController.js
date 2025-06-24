const { google } = require("googleapis");
const { OAuth2Client } = require("google-auth-library");
const User = require("../models/user");
const dotenv = require("dotenv");

dotenv.config();

const oauth2Client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GMAIL_REDIRECT_URI
);

exports.gmailAuthRedirect = async (req, res) => {
    try {
        const userId = req.user.id;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Store the expected email in the user document
        user.expectedGmailEmail = user.email.toLowerCase();
        await user.save();

        // Include both login and Gmail scopes
        const scopes = [
            "openid", // Required for Google Sign-In
            "email",  // Required to get the user's email
            "profile", // Required to get the user's profile info
            "https://www.googleapis.com/auth/gmail.readonly", // Gmail API scope
        ];

        const url = oauth2Client.generateAuthUrl({
            access_type: "offline",
            scope: scopes,
            prompt: "consent", // Ensure users approve new permissions
            state: userId.toString(),
            redirect_uri: process.env.GMAIL_REDIRECT_URI,
            include_granted_scopes: true,
            login_hint: user.email // Add login_hint to encourage using the same email
        });

        res.json({ url });
    } catch (error) {
        res.status(500).json({ message: "Failed to generate Gmail auth URL" });
    }
};

exports.gmailAuthCallback = async (req, res) => {
    try {
        const { code, state, error: authError } = req.query;

        if (authError) {
            return res.send(`
                <html>
                    <body>
                        <h2>Connection Failed</h2>
                        <p>Error: ${authError}</p>
                        <script>
                            window.opener.postMessage({ 
                                gmailConnected: false, 
                                error: "${authError}" 
                            }, "${process.env.FRONTEND_URL}");
                            window.close();
                        </script>
                    </body>
                </html>
            `);
        }

        if (!code || !state) {
            return res.send(`
                <html>
                    <body>
                        <h2>Connection Failed</h2>
                        <p>Error: Missing parameters in callback</p>
                        <script>
                            window.opener.postMessage({ 
                                gmailConnected: false, 
                                error: "Missing parameters in callback" 
                            }, "${process.env.FRONTEND_URL}");
                            window.close();
                        </script>
                    </body>
                </html>
            `);
        }

        const userId = state;
        const user = await User.findById(userId);
        if (!user) {
            return res.send(`
                <html>
                    <body>
                        <h2>Connection Failed</h2>
                        <p>Error: User not found</p>
                        <script>
                            window.opener.postMessage({ 
                                gmailConnected: false, 
                                error: "User not found" 
                            }, "${process.env.FRONTEND_URL}");
                            window.close();
                        </script>
                    </body>
                </html>
            `);
        }

        try {
            const { tokens } = await oauth2Client.getToken({
                code: code,
                redirect_uri: process.env.GMAIL_REDIRECT_URI
            });

            if (!tokens.refresh_token && !user.gmailTokens?.refresh_token) {
                return res.send(`
                    <html>
                        <body>
                            <h2>Connection Failed</h2>
                            <p>Error: No refresh token received</p>
                            <script>
                                window.opener.postMessage({ 
                                    gmailConnected: false, 
                                    error: "No refresh token received. Please revoke access and try again." 
                                }, "${process.env.FRONTEND_URL}");
                                window.close();
                            </script>
                        </body>
                    </html>
                `);
            }

            // Verify the connected email matches the logged-in email
            const ticket = await oauth2Client.verifyIdToken({
                idToken: tokens.id_token,
                audience: process.env.GOOGLE_CLIENT_ID
            });

            const payload = ticket.getPayload();
            if (!payload.email) {
                return res.send(`
                    <html>
                        <body>
                            <h2>Connection Failed</h2>
                            <p>Error: Could not retrieve email from Google</p>
                            <script>
                                window.opener.postMessage({ 
                                    gmailConnected: false, 
                                    error: "Could not retrieve email from Google" 
                                }, "${process.env.FRONTEND_URL}");
                                window.close();
                            </script>
                        </body>
                    </html>
                `);
            }

            // Ensure connected Gmail matches user's email - strict comparison
            if (payload.email.toLowerCase() !== user.email.toLowerCase()) {
                return res.send(`
                    <html>
                        <body>
                            <h2>Connection Failed</h2>
                            <p>Error: You must connect with your logged-in email (${user.email}). You attempted to connect with ${payload.email}.</p>
                            <script>
                                window.opener.postMessage({ 
                                    gmailConnected: false, 
                                    error: "You must connect with your logged-in email (${user.email}). You attempted to connect with ${payload.email}." 
                                }, "${process.env.FRONTEND_URL}");
                                window.close();
                            </script>
                        </body>
                    </html>
                `);
            }

            // Store tokens and update user
            user.gmailTokens = {
                access_token: tokens.access_token,
                refresh_token: tokens.refresh_token || user.gmailTokens?.refresh_token,
                expiry_date: tokens.expiry_date
            };
            user.gmailConnected = true;
            user.gmailEmail = payload.email.toLowerCase();
            await user.save();

            return res.send(`
                <html>
                    <body>
                        <h2>Connection Successful!</h2>
                        <p>Gmail connected as ${user.email}</p>
                        <script>
                            window.opener.postMessage({ 
                                gmailConnected: true, 
                                email: "${user.email}" 
                            }, "${process.env.FRONTEND_URL}");
                            window.close();
                        </script>
                    </body>
                </html>
            `);
        } catch (tokenError) {
            return res.send(`
                <html>
                    <body>
                        <h2>Connection Failed</h2>
                        <p>Error: ${tokenError.message}</p>
                        <script>
                            window.opener.postMessage({ 
                                gmailConnected: false, 
                                error: "${tokenError.message}" 
                            }, "${process.env.FRONTEND_URL}");
                            window.close();
                        </script>
                    </body>
                </html>
            `);
        }
    } catch (error) {
        return res.send(`
            <html>
                <body>
                    <h2>Connection Failed</h2>
                    <p>Error: ${error.message}</p>
                    <script>
                        window.opener.postMessage({ 
                            gmailConnected: false, 
                            error: "${error.message}" 
                        }, "${process.env.FRONTEND_URL}");
                        window.close();
                    </script>
                </body>
            </html>
        `);
    }
};

exports.verifyGmailConnection = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Get the expected email - either from the request body or from the user object
        const expectedEmail = (req.body.email || user.email).toLowerCase();

        // Verify the user email directly
        if (!user.email) {
            return res.status(400).json({
                success: false,
                message: "User email not found. Please log in again."
            });
        }

        // Process authorization code if provided
        if (req.body.code) {
            try {
                const { tokens } = await oauth2Client.getToken({
                    code: req.body.code,
                    redirect_uri: process.env.GMAIL_REDIRECT_URI
                });

                // Verify the token to get the Gmail email
                const ticket = await oauth2Client.verifyIdToken({
                    idToken: tokens.id_token,
                    audience: process.env.GOOGLE_CLIENT_ID
                });

                const payload = ticket.getPayload();
                if (!payload.email) {
                    return res.status(400).json({
                        success: false,
                        message: "Could not retrieve email from Google"
                    });
                }

                // Strict email check
                if (payload.email.toLowerCase() !== expectedEmail) {
                    return res.status(400).json({
                        success: false,
                        message: `Connected Gmail account (${payload.email}) does not match your logged-in email (${expectedEmail}). For security reasons, you must use the same email.`
                    });
                }

                // Always preserve existing refresh token if not provided in new tokens
                user.gmailTokens = {
                    access_token: tokens.access_token,
                    refresh_token: tokens.refresh_token || user.gmailTokens?.refresh_token,
                    expiry_date: tokens.expiry_date
                };
                user.gmailConnected = true;
                user.gmailEmail = payload.email.toLowerCase();

                await user.save();
            } catch (error) {
                return res.status(400).json({
                    success: false,
                    message: "Failed to exchange authorization code for Gmail"
                });
            }
        }

        // Validate the tokens by making a test API call
        try {
            if (!user.gmailTokens?.refresh_token) {
                return res.status(400).json({
                    success: false,
                    message: "Gmail not connected. Please connect your Gmail account."
                });
            }

            // Set up OAuth client with saved tokens
            oauth2Client.setCredentials({
                refresh_token: user.gmailTokens.refresh_token,
                access_token: user.gmailTokens.access_token,
                expiry_date: user.gmailTokens.expiry_date
            });

            // If token is expired, refresh it
            if (!user.gmailTokens.access_token || Date.now() >= user.gmailTokens.expiry_date) {
                const { credentials } = await oauth2Client.refreshAccessToken();
                user.gmailTokens.access_token = credentials.access_token;
                user.gmailTokens.expiry_date = credentials.expiry_date;
                await user.save();
                oauth2Client.setCredentials(credentials);
            }

            // Get Gmail profile to verify connection
            const gmail = google.gmail({ version: "v1", auth: oauth2Client });
            const profile = await gmail.users.getProfile({ userId: 'me' });

            if (!profile || !profile.data || !profile.data.emailAddress) {
                throw new Error("Could not retrieve Gmail profile");
            }

            // Verify the connected email matches the user's email (case-insensitive)
            if (profile.data.emailAddress.toLowerCase() !== user.email.toLowerCase()) {
                // Update user record to reflect the mismatch
                user.gmailConnected = false;
                await user.save();

                return res.status(400).json({
                    success: false,
                    message: `Connected Gmail account (${profile.data.emailAddress}) does not match your logged-in email (${user.email}). Please reconnect with the correct account.`
                });
            }

            // Update user record with verified email
            user.gmailEmail = profile.data.emailAddress.toLowerCase();
            user.gmailConnected = true;
            await user.save();

            // Return success with Gmail email address
            return res.json({
                success: true,
                email: profile.data.emailAddress,
                message: "Gmail connection verified"
            });
        } catch (error) {
            // If token is invalid, clear the tokens
            if (error.message.includes("invalid_grant") || error.message.includes("Invalid credentials")) {
                user.gmailTokens = null;
                user.gmailConnected = false;
                await user.save();

                return res.status(401).json({
                    success: false,
                    message: "Gmail connection is invalid or expired. Please reconnect."
                });
            }

            return res.status(500).json({
                success: false,
                message: "Failed to verify Gmail connection: " + error.message
            });
        }
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error during verification"
        });
    }
};

exports.checkGmailConnectionStatus = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                connected: false,
                message: "User not found"
            });
        }

        // Extract the expected email if provided in the request
        const expectedEmail = (req.headers['x-expected-email'] || user.email).toLowerCase();

        // Check if we have valid tokens
        if (!user.gmailTokens || !user.gmailTokens.refresh_token) {
            return res.json({
                connected: false,
                message: "Gmail not connected"
            });
        }

        // If we have a stored Gmail email, verify it matches the expected email
        if (user.gmailEmail && expectedEmail &&
            user.gmailEmail.toLowerCase() !== expectedEmail) {
            return res.json({
                connected: false,
                message: `Connected Gmail account (${user.gmailEmail}) does not match your logged-in email (${expectedEmail}).`
            });
        }

        return res.json({
            connected: true,
            email: user.gmailEmail || user.email,
            message: "Gmail appears to be connected"
        });
    } catch (error) {
        return res.status(500).json({
            connected: false,
            message: "Error checking Gmail connection status"
        });
    }
};

exports.getEmails = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (!user?.gmailTokens?.refresh_token) {
            return res.status(400).json({ message: "Gmail not connected" });
        }

        // Verify the connected email matches the user's email
        if (user.gmailEmail && user.gmailEmail.toLowerCase() !== user.email.toLowerCase()) {
            return res.status(403).json({
                message: `Connected Gmail account (${user.gmailEmail}) does not match your logged-in email (${user.email}).`
            });
        }

        // Set credentials with refresh token
        oauth2Client.setCredentials({
            refresh_token: user.gmailTokens.refresh_token,
            access_token: user.gmailTokens.access_token,
            expiry_date: user.gmailTokens.expiry_date
        });

        // Always try to refresh token before making API calls
        try {
            if (!user.gmailTokens.access_token || Date.now() >= user.gmailTokens.expiry_date) {
                const { credentials } = await oauth2Client.refreshAccessToken();
                user.gmailTokens.access_token = credentials.access_token;
                user.gmailTokens.expiry_date = credentials.expiry_date;
                await user.save();
                oauth2Client.setCredentials(credentials);
            }
        } catch (error) {
            // Clear invalid tokens
            user.gmailTokens = null;
            user.gmailConnected = false;
            await user.save();
            return res.status(401).json({
                message: "Gmail connection is invalid. Please reconnect Gmail."
            });
        }

        const gmail = google.gmail({ version: "v1", auth: oauth2Client });

        // Get profile first to verify email match
        const profile = await gmail.users.getProfile({ userId: "me" });

        if (profile.data.emailAddress.toLowerCase() !== user.email.toLowerCase()) {
            user.gmailConnected = false;
            await user.save();
            return res.status(403).json({
                message: `Connected Gmail account (${profile.data.emailAddress}) does not match your logged-in email (${user.email}).`
            });
        }

        // Now fetch emails
        const response = await gmail.users.messages.list({
            userId: "me",
            maxResults: 10
        });

        if (!response.data.messages || response.data.messages.length === 0) {
            return res.json({ messages: [], message: "No emails found" });
        }

        res.json(response.data);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch emails" });
    }
};

exports.getEmailById = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (!user?.gmailTokens?.refresh_token) {
            return res.status(400).json({ message: "Gmail not connected" });
        }

        // Verify the connected email matches the user's email
        if (user.gmailEmail && user.gmailEmail.toLowerCase() !== user.email.toLowerCase()) {
            return res.status(403).json({
                message: `Connected Gmail account (${user.gmailEmail}) does not match your logged-in email (${user.email}).`
            });
        }

        // Set credentials with refresh token
        oauth2Client.setCredentials({
            refresh_token: user.gmailTokens.refresh_token,
            access_token: user.gmailTokens.access_token,
            expiry_date: user.gmailTokens.expiry_date
        });

        // Always try to refresh token before making API calls
        try {
            if (!user.gmailTokens.access_token || Date.now() >= user.gmailTokens.expiry_date) {
                const { credentials } = await oauth2Client.refreshAccessToken();
                user.gmailTokens.access_token = credentials.access_token;
                user.gmailTokens.expiry_date = credentials.expiry_date;
                await user.save();
                oauth2Client.setCredentials(credentials);
            }
        } catch (error) {
            // Clear invalid tokens
            user.gmailTokens = null;
            user.gmailConnected = false;
            await user.save();
            return res.status(401).json({
                message: "Gmail connection is invalid. Please reconnect Gmail."
            });
        }

        const gmail = google.gmail({ version: "v1", auth: oauth2Client });

        // Verify the session is still valid with the correct email
        try {
            const profile = await gmail.users.getProfile({ userId: "me" });
            if (profile.data.emailAddress.toLowerCase() !== user.email.toLowerCase()) {
                user.gmailConnected = false;
                await user.save();
                return res.status(403).json({
                    message: `Connected Gmail account (${profile.data.emailAddress}) does not match your logged-in email (${user.email}).`
                });
            }
        } catch (profileError) {
            return res.status(401).json({ message: "Failed to verify Gmail session" });
        }

        // Get the specific email
        const message = await gmail.users.messages.get({
            userId: "me",
            id: req.params.id
        });

        res.json(message.data);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch email" });
    }
};

exports.getGmailStatus = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Extract expected email from header or use user email
        const expectedEmail = (req.headers['x-expected-email'] || user.email).toLowerCase();

        // Check if user has Gmail tokens
        if (!user.gmailTokens || !user.gmailTokens.refresh_token) {
            return res.json({ connected: false });
        }

        // Use the Gmail API to get user profile to verify tokens work
        try {
            oauth2Client.setCredentials({
                refresh_token: user.gmailTokens.refresh_token,
                access_token: user.gmailTokens.access_token,
                expiry_date: user.gmailTokens.expiry_date
            });

            // Try to refresh token if needed
            if (!user.gmailTokens.access_token || Date.now() >= user.gmailTokens.expiry_date) {
                try {
                    const { credentials } = await oauth2Client.refreshAccessToken();
                    user.gmailTokens.access_token = credentials.access_token;
                    user.gmailTokens.expiry_date = credentials.expiry_date;
                    await user.save();
                    oauth2Client.setCredentials(credentials);
                } catch (refreshError) {
                    // Clear invalid tokens
                    user.gmailTokens = null;
                    user.gmailConnected = false;
                    await user.save();
                    return res.json({ connected: false, error: "Invalid Gmail tokens" });
                }
            }

            const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
            const profile = await gmail.users.getProfile({ userId: 'me' });

            // Case-insensitive email comparison
            if (profile.data.emailAddress.toLowerCase() !== expectedEmail) {
                // Update user record to reflect the mismatch
                user.gmailConnected = false;
                await user.save();

                return res.json({
                    connected: false,
                    error: `Connected Gmail account (${profile.data.emailAddress}) does not match your logged-in email (${expectedEmail}).`
                });
            }

            // Update user record with verified email
            user.gmailEmail = profile.data.emailAddress.toLowerCase();
            user.gmailConnected = true;
            await user.save();

            return res.json({
                connected: true,
                email: profile.data.emailAddress,
                messagesTotal: profile.data.messagesTotal || 0
            });

        } catch (error) {
            // Handle token refresh explicitly for common errors
            if ((error.message && error.message.includes('invalid_token')) ||
                (error.response && error.response.status === 401)) {

                // Try to refresh the token
                try {
                    oauth2Client.setCredentials({
                        refresh_token: user.gmailTokens.refresh_token
                    });

                    const { tokens } = await oauth2Client.refreshAccessToken();
                    user.gmailTokens.access_token = tokens.access_token;
                    user.gmailTokens.expiry_date = tokens.expiry_date;
                    await user.save();

                    // Try again with new token
                    oauth2Client.setCredentials(user.gmailTokens);
                    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
                    const profile = await gmail.users.getProfile({ userId: 'me' });

                    // Verify the connected email matches the expected email
                    if (profile.data.emailAddress.toLowerCase() !== expectedEmail) {
                        user.gmailConnected = false;
                        await user.save();

                        return res.json({
                            connected: false,
                            error: `Connected Gmail account (${profile.data.emailAddress}) does not match your logged-in email (${expectedEmail}).`
                        });
                    }

                    // Update user record with verified email
                    user.gmailEmail = profile.data.emailAddress.toLowerCase();
                    user.gmailConnected = true;
                    await user.save();

                    return res.json({
                        connected: true,
                        email: profile.data.emailAddress,
                        messagesTotal: profile.data.messagesTotal || 0
                    });
                } catch (refreshError) {
                    // Clear invalid tokens
                    user.gmailTokens = null;
                    user.gmailConnected = false;
                    await user.save();

                    return res.json({ connected: false, error: "Failed to refresh Gmail tokens" });
                }
            }

            return res.json({ connected: false, error: "Invalid Gmail tokens" });
        }
    } catch (error) {
        return res.status(500).json({
            connected: false,
            message: "Failed to get Gmail status",
            error: error.message
        });
    }
};

exports.disconnectGmail = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Clear Gmail tokens and connection status
        user.gmailTokens = null;
        user.gmailConnected = false;
        user.gmailEmail = null;
        await user.save();

        // Try to revoke access with Google if we have a token
        if (req.body.accessToken) {
            try {
                await oauth2Client.revokeToken(req.body.accessToken);
            } catch (revokeError) {
                // Continue anyway since we've cleared the tokens locally
            }
        }

        return res.json({
            success: true,
            message: "Gmail disconnected successfully"
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error disconnecting Gmail"
        });
    }
};