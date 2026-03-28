import { describe, expect, test } from "vitest";

import { parseTinyFishResultPayload } from "../src/providers/index.js";
import { defaultSources } from "../src/providers/index.js";

const sampleOpportunity = {
  title: "Y Combinator Startup Accelerator",
  issuer: "Y Combinator",
  source_url: "https://www.ycombinator.com/apply",
  application_url: "https://www.ycombinator.com/apply",
  source_type: "accelerator",
  reward_value_text: "$500,000 standard deal",
  deadline_text: null,
  geography: "Global",
  eligibility_bullets: ["Early-stage startup founders"],
  summary: "Y Combinator runs an accelerator for early-stage startups.",
  evidence_snippets: ["$500,000 standard deal", "Apply to the startup accelerator"]
};

describe("parseTinyFishResultPayload", () => {
  test("unwraps nested TinyFish result shapes into strict opportunities", () => {
    const parsed = parseTinyFishResultPayload({
      data: {
        result: JSON.stringify([sampleOpportunity])
      }
    });

    expect(parsed).toHaveLength(1);
    expect(parsed[0].title).toBe(sampleOpportunity.title);
    expect(parsed[0].source_type).toBe("accelerator");
  });

  test("coerces alternate TinyFish keys using source context", () => {
    const parsed = parseTinyFishResultPayload({
      output: "```json\n[{\"name\":\"AWS Activate Credits for Startups\",\"url\":\"https://aws.amazon.com/startups/credits\",\"provider\":\"Amazon Web Services\",\"description\":\"Up to $100,000 in credits for eligible startups.\",\"evidence\":[\"Up to $100,000 in AWS Activate credits\",\"Apply through the AWS Activate program\"]}]\n```"
    }, defaultSources.find((item) => item.id === "aws-activate"));

    expect(parsed).toHaveLength(1);
    expect(parsed[0].title).toBe("AWS Activate Credits for Startups");
    expect(parsed[0].source_url).toBe("https://aws.amazon.com/startups/credits");
    expect(parsed[0].source_type).toBe("grant");
    expect(parsed[0].evidence_snippets[0]).toContain("$100,000");
  });
});
