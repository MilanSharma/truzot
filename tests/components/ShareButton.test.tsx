import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ShareButton from "@/components/ShareButton";

describe("ShareButton", () => {
  it("renders with label text", () => {
    render(
      <ShareButton imageUrl="https://example.com/img.jpg" label="Share" />,
    );
    expect(screen.getByText("Share")).toBeInTheDocument();
  });
});
