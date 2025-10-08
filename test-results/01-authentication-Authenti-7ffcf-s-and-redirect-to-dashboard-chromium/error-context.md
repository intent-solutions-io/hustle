# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - link "Back to Home" [ref=e3] [cursor=pointer]:
      - /url: /
      - img [ref=e4]
      - text: Back to Home
    - generic [ref=e6]:
      - generic [ref=e7]:
        - generic [ref=e8]:
          - generic [ref=e10]: H
          - generic [ref=e11]: Welcome Back
        - generic [ref=e12]: Sign in to your account
      - generic [ref=e14]:
        - generic [ref=e15]:
          - text: Email Address
          - textbox "Email Address" [ref=e16]:
            - /placeholder: you@example.com
            - text: testuser1759877059972@example.com
        - generic [ref=e17]:
          - generic [ref=e18]:
            - generic [ref=e19]: Password
            - link "Forgot password?" [ref=e20] [cursor=pointer]:
              - /url: /forgot-password
          - generic [ref=e21]:
            - textbox "Password" [ref=e22]: TestPassword123!
            - button [ref=e23] [cursor=pointer]:
              - img [ref=e24]
        - paragraph [ref=e28]: An error occurred. Please try again.
        - button "Sign In" [ref=e29] [cursor=pointer]
        - paragraph [ref=e30]:
          - text: Don't have an account?
          - link "Create Account" [ref=e31] [cursor=pointer]:
            - /url: /register
  - alert [ref=e32]
```