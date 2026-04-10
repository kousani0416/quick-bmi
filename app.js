"use strict";

const state = {
  unit: "metric",
  calculationCount: 0,
  latestContext: null,
  aiEndpoint: "https://quickbmi-ai-proxy.quick-bmi.workers.dev/api/analyze",
};

const refs = {
  metricBtn: document.getElementById("metricBtn"),
  imperialBtn: document.getElementById("imperialBtn"),
  metricFields: document.getElementById("metricFields"),
  imperialFields: document.getElementById("imperialFields"),
  heightCm: document.getElementById("heightCm"),
  weightKg: document.getElementById("weightKg"),
  heightFt: document.getElementById("heightFt"),
  heightIn: document.getElementById("heightIn"),
  weightLbs: document.getElementById("weightLbs"),
  calculateBtn: document.getElementById("calculateBtn"),
  message: document.getElementById("message"),
  resultCard: document.getElementById("resultCard"),
  bmiValue: document.getElementById("bmiValue"),
  bmiCategory: document.getElementById("bmiCategory"),
  healthTip: document.getElementById("healthTip"),
  whoRange: document.getElementById("whoRange"),
  riskLevel: document.getElementById("riskLevel"),
  recommendation: document.getElementById("recommendation"),
  aiAnalyzeBtn: document.getElementById("aiAnalyzeBtn"),
  aiStatus: document.getElementById("aiStatus"),
  aiOutput: document.getElementById("aiOutput"),
  interstitial: document.getElementById("interstitial"),
  closeInterstitial: document.getElementById("closeInterstitial"),
};

function setUnit(unit) {
  state.unit = unit;
  const metricActive = unit === "metric";

  refs.metricBtn.classList.toggle("is-active", metricActive);
  refs.imperialBtn.classList.toggle("is-active", !metricActive);
  refs.metricFields.classList.toggle("hidden", !metricActive);
  refs.imperialFields.classList.toggle("hidden", metricActive);

  clearMessage();
}

function clearMessage() {
  refs.message.textContent = "";
  refs.message.className = "message";
}

function setMessage(text, type) {
  refs.message.textContent = text;
  refs.message.className = `message ${type}`;
}

function toNumber(value) {
  return Number.parseFloat(value);
}

function inchesFromImperial(feet, inches) {
  return feet * 12 + inches;
}

function bmiMetric(heightCm, weightKg) {
  const heightM = heightCm / 100;
  return weightKg / (heightM * heightM);
}

function bmiImperial(heightInches, weightLbs) {
  return (weightLbs * 703) / (heightInches * heightInches);
}

function categoryFromBMI(bmi) {
  if (bmi < 18.5) return { key: "underweight", name: "Underweight" };
  if (bmi < 25) return { key: "normal", name: "Normal" };
  if (bmi < 30) return { key: "overweight", name: "Overweight" };
  return { key: "obese", name: "Obese" };
}

function whoAnalysis(categoryKey) {
  const map = {
    underweight: {
      range: "< 18.5",
      risk: "Nutritional risk may be elevated.",
      recommendation:
        "Focus on calorie-dense balanced meals, protein intake, and discuss causes if unintentional.",
    },
    normal: {
      range: "18.5 - 24.9",
      risk: "Low relative risk for weight-associated conditions.",
      recommendation:
        "Maintain current habits: regular activity, sleep quality, hydration, and balanced eating.",
    },
    overweight: {
      range: "25.0 - 29.9",
      risk: "Moderate cardiometabolic risk may increase over time.",
      recommendation:
        "Aim for gradual weight reduction through activity and nutrition consistency.",
    },
    obese: {
      range: ">= 30.0",
      risk: "Higher risk for metabolic and cardiovascular complications.",
      recommendation:
        "Consider clinician-guided weight management and structured lifestyle support.",
    },
  };
  return map[categoryKey];
}

function tipFromCategory(categoryKey) {
  const tips = {
    underweight: "Consider a nutrient-dense diet and talk to a healthcare professional.",
    normal: "Great range. Keep consistent activity, hydration, and balanced meals.",
    overweight: "A modest calorie deficit and regular exercise can improve outcomes.",
    obese: "Consider guided support from a clinician for a safe, structured plan.",
  };
  return tips[categoryKey];
}

function validateMetric(heightCm, weightKg) {
  const warnings = [];

  if (!Number.isFinite(heightCm) || !Number.isFinite(weightKg)) {
    return { ok: false, error: "Please enter valid numeric values.", warnings };
  }
  if (heightCm <= 0) return { ok: false, error: "Height must be greater than 0.", warnings };
  if (weightKg <= 0) return { ok: false, error: "Weight must be greater than 0.", warnings };
  if (heightCm < 0 || weightKg < 0) {
    return { ok: false, error: "Negative values are not allowed.", warnings };
  }
  if (heightCm > 300) warnings.push("Warning: height is above 300 cm.");
  if (weightKg > 500) warnings.push("Warning: weight is above 500 kg.");

  return { ok: true, warnings };
}

function validateImperial(heightInches, weightLbs) {
  const warnings = [];

  if (!Number.isFinite(heightInches) || !Number.isFinite(weightLbs)) {
    return { ok: false, error: "Please enter valid numeric values.", warnings };
  }
  if (heightInches <= 0) return { ok: false, error: "Height must be greater than 0.", warnings };
  if (weightLbs <= 0) return { ok: false, error: "Weight must be greater than 0.", warnings };
  if (heightInches < 0 || weightLbs < 0) {
    return { ok: false, error: "Negative values are not allowed.", warnings };
  }

  const heightCm = heightInches * 2.54;
  const weightKg = weightLbs * 0.45359237;
  if (heightCm > 300) warnings.push("Warning: height is above 300 cm equivalent.");
  if (weightKg > 500) warnings.push("Warning: weight is above 500 kg equivalent.");

  return { ok: true, warnings };
}

function showResult(bmi, category) {
  const rounded = bmi.toFixed(1);
  const analysis = whoAnalysis(category.key);
  refs.bmiValue.textContent = rounded;
  refs.bmiCategory.textContent = category.name;
  refs.bmiCategory.className = `category-${category.key}`;
  refs.healthTip.textContent = tipFromCategory(category.key);
  refs.whoRange.textContent = `WHO Range: ${analysis.range}`;
  refs.riskLevel.textContent = `Risk Level: ${analysis.risk}`;
  refs.recommendation.textContent = `Recommendation: ${analysis.recommendation}`;
  refs.resultCard.classList.remove("hidden");
}

function setAIStatus(text, type) {
  refs.aiStatus.textContent = text;
  refs.aiStatus.className = `message ${type}`;
}

function renderAIOutput(text) {
  refs.aiOutput.textContent = text;
  refs.aiOutput.classList.remove("hidden");
}

function buildLocalSmartAnalysis(context) {
  const { bmi, categoryName, unit, height, weight } = context;
  return [
    `Smart Analysis (Local):`,
    `Your BMI is ${bmi.toFixed(1)} (${categoryName}).`,
    `Input profile: ${height} / ${weight} in ${unit} mode.`,
    `Priority: consistency over intensity. Start with realistic weekly habits, monitor energy levels, and reassess in 2-4 weeks.`,
    `This is educational guidance, not a diagnosis.`,
  ].join("\n");
}

async function fetchAISmartAnalysis(context) {
  const endpoint = (state.aiEndpoint || "").trim();
  if (!endpoint) {
    throw new Error("AI endpoint is not configured.");
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(endpoint, window.location.origin);
  } catch (_err) {
    throw new Error("AI endpoint URL is invalid.");
  }

  const response = await fetch(parsedUrl.toString(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(context),
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("AI endpoint not found. Deploy/configure your Worker first.");
    }
    throw new Error(`AI request failed (${response.status}).`);
  }
  const data = await response.json();
  const content = data?.analysis;
  if (!content) throw new Error("AI response was empty.");
  return content.trim();
}

async function generateAIInsight() {
  if (!state.latestContext) {
    setAIStatus("Calculate BMI first to generate analysis.", "error");
    return;
  }

  refs.aiAnalyzeBtn.disabled = true;
  setAIStatus("Generating smart analysis...", "ok");
  try {
    const aiText = await fetchAISmartAnalysis(state.latestContext);
    renderAIOutput(aiText);
    setAIStatus("AI analysis generated successfully.", "ok");
  } catch (error) {
    renderAIOutput(buildLocalSmartAnalysis(state.latestContext));
    setAIStatus(`${error.message} Showing local smart analysis instead.`, "warn");
  } finally {
    refs.aiAnalyzeBtn.disabled = false;
  }
}

function maybeShowInterstitial() {
  state.calculationCount += 1;
  if (state.calculationCount % 3 === 0) {
    refs.interstitial.classList.remove("hidden");
  }
}

function calculate() {
  clearMessage();
  let bmi;
  let category;
  let inputSummary = "";

  if (state.unit === "metric") {
    const heightCm = toNumber(refs.heightCm.value);
    const weightKg = toNumber(refs.weightKg.value);
    const result = validateMetric(heightCm, weightKg);
    if (!result.ok) {
      refs.resultCard.classList.add("hidden");
      setMessage(result.error, "error");
      return;
    }
    bmi = bmiMetric(heightCm, weightKg);
    category = categoryFromBMI(bmi);
    inputSummary = `${heightCm} cm / ${weightKg} kg`;

    if (result.warnings.length) {
      setMessage(result.warnings.join(" "), "warn");
    } else {
      setMessage("BMI calculated successfully.", "ok");
    }
  } else {
    const feet = toNumber(refs.heightFt.value);
    const inches = toNumber(refs.heightIn.value);
    const weightLbs = toNumber(refs.weightLbs.value);

    if (!Number.isFinite(feet) || !Number.isFinite(inches)) {
      refs.resultCard.classList.add("hidden");
      setMessage("Please enter valid height in feet and inches.", "error");
      return;
    }
    if (feet < 0 || inches < 0) {
      refs.resultCard.classList.add("hidden");
      setMessage("Negative values are not allowed.", "error");
      return;
    }

    const totalInches = inchesFromImperial(feet, inches);
    const result = validateImperial(totalInches, weightLbs);
    if (!result.ok) {
      refs.resultCard.classList.add("hidden");
      setMessage(result.error, "error");
      return;
    }

    bmi = bmiImperial(totalInches, weightLbs);
    category = categoryFromBMI(bmi);
    inputSummary = `${feet} ft ${inches} in / ${weightLbs} lbs`;

    if (result.warnings.length) {
      setMessage(result.warnings.join(" "), "warn");
    } else {
      setMessage("BMI calculated successfully.", "ok");
    }
  }

  showResult(bmi, category);
  const analysis = whoAnalysis(category.key);
  state.latestContext = {
    bmi,
    categoryName: category.name,
    unit: state.unit,
    height: inputSummary.split(" / ")[0],
    weight: inputSummary.split(" / ")[1],
    whoRange: analysis.range,
    risk: analysis.risk,
    recommendation: analysis.recommendation,
  };
  refs.aiOutput.classList.add("hidden");
  refs.aiOutput.textContent = "";
  setAIStatus("", "");
  maybeShowInterstitial();
}

refs.metricBtn.addEventListener("click", () => setUnit("metric"));
refs.imperialBtn.addEventListener("click", () => setUnit("imperial"));
refs.calculateBtn.addEventListener("click", calculate);
refs.aiAnalyzeBtn.addEventListener("click", generateAIInsight);
refs.closeInterstitial.addEventListener("click", () => {
  refs.interstitial.classList.add("hidden");
});
