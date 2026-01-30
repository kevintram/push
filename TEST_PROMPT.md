0. Study @SPEC.md and @TEST.md.
1. Please go through one of the uncompleted test suites using claude in chrome. Run the web server and API server as background processes so you can observe their logs. 
2. If you discover any issues, please perform root cause analysis and write your findings in the @TEST.md file. You may use up to 500 parallel Sonnet subagents for searches/reads. You may only use 1 Sonnet subagent for build/tests. Use Opus subagents when complex reasoning is needed. 
3. Once you have completed the test suite, update @TEST.md that you have completed those tests. 

Note: Since the API uses cookie-based authentication, you will not be able to hit the API directly and must proceed through the browser. 