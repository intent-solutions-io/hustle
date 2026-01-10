# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - main [ref=e3]:
    - generic [ref=e4]:
      - generic [ref=e5]:
        - button "Toggle Sidebar" [ref=e6] [cursor=pointer]:
          - img
          - generic [ref=e7]: Toggle Sidebar
        - heading "Dashboard" [level=2] [ref=e8]
      - button "JT" [ref=e10] [cursor=pointer]:
        - generic [ref=e12]: JT
    - main [ref=e13]:
      - generic [ref=e14]:
        - generic [ref=e15]:
          - generic [ref=e16]:
            - heading "Athletes" [level=1] [ref=e17]
            - paragraph [ref=e18]: Manage your athletes and their performance
          - link "Add Athlete" [ref=e19] [cursor=pointer]:
            - /url: /dashboard/add-athlete
            - button "Add Athlete" [ref=e20]:
              - img
              - text: Add Athlete
        - generic [ref=e22]:
          - generic [ref=e23]: ⚽
          - heading "No athletes yet" [level=3] [ref=e24]
          - paragraph [ref=e25]: Get started by adding your first athlete profile to begin tracking their performance
          - link "Add Your First Athlete" [ref=e26] [cursor=pointer]:
            - /url: /dashboard/add-athlete
            - button "Add Your First Athlete" [ref=e27]:
              - img
              - text: Add Your First Athlete
  - button "Open Next.js Dev Tools" [ref=e33] [cursor=pointer]:
    - img [ref=e34]
  - alert [ref=e37]
  - iframe [ref=e38]:
    
```