# rapidvote

## Getting Started

### Project Structure

The root of this repository contains the necessary artifacts to build the frontend of our
webapp. Within the `api/` folder, you should see the Gin application.

***Note***: Before you can start running the API, you must create a `.env` file that will contain the
credentials needed to authenticate with our MongoDB instance in MongoDB Atlas.
The credentials can be found Project Pages tab in Jira. Create a file within the `api/`
directory called `.env`, and copy all of the contents from Jira to that file.

You must also whitelist your IP Address within MongoDB Atlas in order for you to make successful requests
to the database. You can do so by adding your IP in the Network Access tab in the MongoDB Atlas dashboard.

### Setting up React

First, install the latest recommended version of [Node](https://nodejs.org/en/).
Now to download the packages from `package.json` used to build our React App, run
```
npm install
```

You should now have all the tools to run and test the React Application. To confirm, launch
a development server by running the following command:
```
npm start
```

A window should open up on your browser with the homepage of our React App.
If there were no errors, you are now ready to start developing the frontend!

Any changes made to the source files within the `src/` directory will refresh the
development server and display your changes.

### Setting up Gin 

First, install [Go](https://go.dev/dl/).

To build the server, navigate into the `api/` directory and run,
```
go build
```

To run the server,
```
go run main.go
```
or
```
go build && ./api
```

It should display some logging information about the Gin application. If it failed at this point, try changing
the port within `main.go` and recompiling.

Now navigate to `localhost:8080/test`. If a test page with the text `Hello, World!` appears, you are set up!

Note that any changes made to the application while it is running will not refresh the server, as you will
need to recompile any changes with the `go build` command.

### Committing Changes

(1) To commit your changes, first create a new branch locally. Prefix your local branch name with the issue number
in Jira. For example, if I'm working on Task with issue number (RAP-11), I'll create a branch with name like so:
```
git checkout -b rap-11
```

You can see what files are ready to be commited via:
```
git status
```

(2) Then to stage your changes, run
```
git add -A
```

(3)Now, set a commit message describing what you did.
```
git commit -m "your commit message here"
```

(4) When you are ready to push, run
```
git push -u origin <your-branch-name>
```

(5) Next, make sure you sync the main branch with the branch you just pushed.
```
git pull origin main 
```
You can go ahead and resolve any merge conflicts here if necessary. 

If you had to resolve any conflicts, go back to step (2) and redo the process.
If it says "Already up to date", then you can now make a Pull Request on GitHub!

At this point, you should also move the Issue you worked on in Jira from In Progress to Needs Review. 
A commit won't be looked at and merged until I see it in the Needs Review section of the Jira Board!
Once your Pull Request has been merged, you can now update your local repository by running,
```
git checkout main && git pull
```
