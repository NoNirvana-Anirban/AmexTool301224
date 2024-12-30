document.addEventListener("DOMContentLoaded", () => {
  console.log("Script Loaded: DOM fully loaded and parsed.");

  const spendRange = document.getElementById("spendRange");
  const spendDisplay = document.getElementById("spendDisplay");
  const userSelections = {};

  const spendRanges = [
    "<10,000", "10,000-25,000", "25,000-50,000", "50,000-100,000", "100,000-2,00,000", ">2,00,000"
  ];

  const googleScriptUrl = "https://script.google.com/macros/s/AKfycbx7oc0c-IlBe1aWjeRxPCNVGtJPHQN3J5jGVD91mFmEJO-6Xg_-1gsRlQznoldKOI7L/exec";

  const amexCards = [
    {
      cardName: "The American Express Platinum Card",
      criteria: {
        vipEvents: "Yes",
        rewardsOrCashback: "Rewards",
        internationalTravel: "Yes",
        annualIncome: "25+",
        monthlySpendRange: ">2,00,000",
        employmentType: "Salaried",
      },
    },
    {
      cardName: "The American Express Platinum Card",
      criteria: {
        vipEvents: "Yes",
        rewardsOrCashback: "Rewards",
        internationalTravel: "Yes",
        annualIncome: "15-25",
        monthlySpendRange: ">2,00,000",
        employmentType: "Business",
      },
    },
    {
      cardName: "Gold Card",
      criteria: {
        vipEvents: "Occasionally",
        rewardsOrCashback: "Rewards",
        internationalTravel: "Yes",
        annualIncome: "15-20",
        monthlySpendRange: "100,000-2,00,000",
        employmentType: "Business",
      },
    },
    {
      cardName: "Silver Card",
      criteria: {
        vipEvents: "No",
        rewardsOrCashback: "Either",
        internationalTravel: "No",
        annualIncome: "10-15",
        monthlySpendRange: "50,000-100,000",
        employmentType: "Business",
      },
    },
  ];

  const questionKeyMapping = {
    "What is your Annual Income?": "annualIncome",
    "Estimated Monthly Credit Card Spend": "monthlySpendRange",
    "Do you like attending exclusive VIP Events?": "vipEvents",
    "Do you prefer Rewards or Cashback?": "rewardsOrCashback",
    "Do you travel internationally most years?": "internationalTravel",
    "What is your Employment Type?": "employmentType",
  };

  function parseRange(range) {
    if (!range) return [0, 0];
    if (range.includes("+")) return [parseInt(range.replace(",", "").replace("+", "")), Infinity];
    const [min, max] = range.replace(",", "").split("-").map(Number);
    return [min, max];
  }

  function isInRange(userValue, cardRange) {
    const [cardMin, cardMax] = parseRange(cardRange);
    const isInRange = userValue >= cardMin && userValue <= cardMax;
    console.log(`Checking range: User Value = ${userValue}, Card Range = [${cardMin}, ${cardMax}], Is In Range = ${isInRange}`);
    return isInRange;
  }

  function matchesCriteria(userValue, cardValue) {
    const isMatch = cardValue === userValue || cardValue === "Either";
    console.log(`Matching criteria: User Value = ${userValue}, Card Value = ${cardValue}, Is Match = ${isMatch}`);
    return isMatch;
  }

  function scoreCards(cards, userSelections) {
    console.log("Scoring cards based on user selections:", userSelections);
    return cards.map(card => {
      let score = 0;
      console.log(`Evaluating card: ${card.cardName}`);
      Object.keys(card.criteria).forEach(key => {
        if (key === "annualIncome" && userSelections[key]) {
          if (isInRange(parseInt(userSelections[key]), card.criteria[key])) {
            console.log(`  Matched income range for ${card.cardName}`);
            score += 2;
          }
        } else if (key === "monthlySpendRange" && userSelections[key]) {
          if (isInRange(parseRange(userSelections[key])[0], card.criteria[key])) {
            console.log(`  Matched spend range for ${card.cardName}`);
            score += 2;
          }
        } else if (userSelections[key] && matchesCriteria(userSelections[key], card.criteria[key])) {
          console.log(`  Matched exact criteria for ${card.cardName} on ${key}`);
          score += 3;
        }
      });
      console.log(`Final score for ${card.cardName}: ${score}`);
      return { ...card, score };
    }).sort((a, b) => b.score - a.score);
  }

  spendDisplay.textContent = "Please select a range";

  spendRange.addEventListener("input", () => {
    const selectedIndex = parseInt(spendRange.value, 10);
    spendDisplay.textContent = spendRanges[selectedIndex];
    userSelections["monthlySpendRange"] = spendRanges[selectedIndex];
    console.log("Updated spend range in user selections:", userSelections);
  });

  document.querySelectorAll(".button-group button").forEach((button) => {
    button.addEventListener("click", (event) => {
      const value = event.target.getAttribute("data-value");
      const question = event.target.closest(".question").querySelector("h2").textContent;
      const key = questionKeyMapping[question];
      userSelections[key] = value;
      console.log(`Updated user selections with ${key}:`, userSelections);

      const group = event.target.parentElement;
      group.querySelectorAll("button").forEach((btn) => btn.classList.remove("selected"));
      event.target.classList.add("selected");
    });
  });

  document.getElementById("cardFinderForm").addEventListener("submit", (event) => {
    event.preventDefault();

    console.log("Submitting form with final user selections:", userSelections);
    const scoredCards = scoreCards(amexCards, userSelections);

    if (scoredCards.length > 0) {
      const topCard = scoredCards[0].cardName;
      console.log(`Top card selected: ${topCard}`);

      // JSONP Request
      const callback = "processCardDetails";
      const script = document.createElement("script");
      script.src = `${googleScriptUrl}?card=${encodeURIComponent(topCard)}&callback=${callback}`;
      document.body.appendChild(script);
    } else {
      console.log("No matching cards found.");
	  
      document.getElementById("result").innerHTML = "<h3>No matching cards found.</h3>";
    }
  });
});

// JSONP Callback Function
function processCardDetails(data) {
  // Unhide the result block
  document.getElementById("result").style.display = "block"; 

  // Populate the result block
  if (data.error) {
    document.getElementById("result").innerHTML = `<h3>Error: ${data.error}</h3>`;
  } else {
    document.getElementById("result").innerHTML = `
      <div style="text-align: center;"> <!-- Center align the content -->
        <h3 style="color: black; font-size: 14px; margin-bottom: 5px;">Your ideal Amex Card is:</h3>
        <h3 style="color: #0077c8; font-size: 18px; margin-top: 0;">${data.card}</h3>
        <img src="${data.imageUrl}" alt="${data.card}" style="max-width: 100%; height: auto; margin-top: 10px;">
        <button id="applyNow" class="submitbutton" onclick="window.open('${data.imageUrl}', '_blank')" 
          style="margin-top: 15px; padding: 10px 20px; font-size: 16px; background-color: #0077c8; color: white; border: none; cursor: pointer;">
          Apply Now
        </button>
      </div>
    `;
  }
}
