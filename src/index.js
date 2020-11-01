import { interpret, Machine } from "xstate";
import jikanjs from "jikanjs"; // Uses per default the API version 3

// Machine

const searchMachine = Machine(
  {
    id: "search",
    context: {
      timer: null,
      query: "",
      results: {},
      error: {},
    },
    initial: "idle",
    states: {
      idle: {
        on: {
          focus: "focused",
        },
      },
      focused: {
        on: {
          keyup: {
            target: "typing",
          },
          blur: "idle",
        },
      },

      typing: {
        entry: ["updateQuery", "clearTimer", "setTimer"],
        on: {
          keyup: {
            target: "typing",
          },
          FETCH: {
            target: "pending",
            cond: "checkQuery",
          },
          blur: {
            target: "idle",
          },
        },
      },
      pending: {
        entry: "goFetch",
        on: {
          keyup: {
            target: "typing",
          },
          RESOLVE: {
            target: "resolved",
          },
          REJECT: {
            target: "rejected",
          },
          blur: {
            target: "idle",
          },
        },
      },
      resolved: {
        on: {
          keyup: {
            target: "typing",
          },
          blur: {
            target: "idle",
          },
        },
      },
      rejected: {
        on: {
          keyup: {
            target: "typing",
          },
          blur: {
            target: "idle",
          },
        },
      },
    },
  },
  {
    actions: {
      setTimer: (context, event) => {
        context.timer = setTimeout(() => {
          service.send("FETCH");
        }, 1000);
      },
      clearTimer: (context, event) => {
        clearTimeout(context.timer);
      },
      goFetch: (context, event) => {
        jikanjs
          .search("anime", context.query, [1])
          .then((response) => {
            console.log(response.results);
            context.results = response.results;
            service.send("RESOLVE");
          })
          .catch((error) => {
            console.error(error);
            context.error = error.message;
            service.send("REJECT");
          });
      },
      updateQuery: (context, event) => {
        context.query = event.target.value;
      },
    },
    guards: {
      checkQuery: (context, event) => context.query != "",
    },
  }
);

// View

const service = interpret(searchMachine);

service.onTransition((state) => {
  document.querySelector("#state").textContent = state.toStrings();
  var stateBox = document.querySelector(".state-box");
  var results = document.querySelector(".results");
  results.style.display = "none";
  if (state.matches("idle")) {
    stateBox.style.backgroundColor = "grey";
  } else if (state.matches("focused")) {
    stateBox.style.backgroundColor = "yellow";
  } else if (state.matches("typing")) {
    stateBox.style.backgroundColor = "cyan";
  } else if (state.matches("pending")) {
    stateBox.style.backgroundColor = "orange";
    results.style.display = "initial";
    results.innerHTML = "Loading...";
    results.style.color = "black";
  } else if (state.matches("resolved")) {
    results.innerHTML = state.context.results[0].title;
    stateBox.style.backgroundColor = "green";
    results.style.display = "initial";
    results.style.color = "black";
  } else if (state.matches("rejected")) {
    stateBox.style.backgroundColor = "red";
    results.style.display = "initial";
    results.style.color = "red";
    results.innerHTML = state.context.error;
  }
});

service.start();

var input = document.querySelector("#input");

input.addEventListener("focus", (event) => {
  service.send(event);
});

input.addEventListener("keyup", (event) => {
  service.send(event);
});

input.addEventListener("blur", (event) => {
  service.send(event);
});
