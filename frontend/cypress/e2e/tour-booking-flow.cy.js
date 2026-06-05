describe("Tour booking flow", () => {
  const tourSlug = "amazing-bali-tour";
  const tourId = "tour_123";
  const bookingId = "booking_789";

  const tourFixture = {
    id: tourId,
    title: "Amazing Bali Tour",
    description: "Explore Bali beaches and temples in a guided experience.",
    location: "Bali, Indonesia",
    share_slug: tourSlug,
    price_cents: 259900,
    currency: "USD",
    guest_limit: 8,
    start_date: "2026-10-01",
    end_date: "2026-10-05",
    images: [],
    itinerary: [
      {
        day: 1,
        title: "Arrival and beachside welcome",
        description: "Airport pickup and sunset dinner.",
        items: ["Airport pickup", "Welcome dinner"],
      },
    ],
  };

  beforeEach(() => {
    cy.intercept("GET", "**/api/v1/public/tours?**", {
      statusCode: 200,
      body: {
        data: [tourFixture],
        pagination: {
          page: 1,
          limit: 9,
          total: 1,
          totalPages: 1,
        },
      },
    }).as("listTours");

    cy.intercept("GET", `**/api/v1/public/tours/${tourSlug}`, {
      statusCode: 200,
      body: tourFixture,
    }).as("getPublicTour");

    cy.intercept("POST", `**/api/v1/public/tours/${tourSlug}/bookings`, {
      statusCode: 201,
      body: {
        id: bookingId,
        total_price_cents: 519800,
      },
    }).as("createBooking");
  });

  it("completes booking from home page to success page", () => {
    cy.visit("/");
    cy.wait("@listTours");

    cy.contains("Reserve", { timeout: 10000 }).click();
    cy.url().should("include", `/t/${tourSlug}/book`);

    cy.get('input[placeholder="e.g. John Doe"]').type("John Doe");
    cy.get('input[placeholder="you@example.com"]').type("john@example.com");
    cy.get('input[type="number"]').clear().type("2");
    cy.get('textarea[placeholder*="Airport pickup timing"]').type("Vegetarian meals requested.");

    cy.contains("button", "Continue to Payment").click();
    cy.url().should("include", `/t/${tourSlug}/payment`);

    cy.get('input[placeholder="Name on card"]').type("John Doe");
    cy.get('input[placeholder="4242 4242 4242 4242"]').type("4242424242424242");
    cy.get('input[placeholder="08/28"]').type("0828");
    cy.get('input[placeholder="123"]').type("123");

    cy.contains("button", "Pay & Confirm Booking").click();
    cy.wait("@createBooking");

    cy.url().should("include", `/t/${tourSlug}/booking-success`);
    cy.contains("Your booking is successful").should("be.visible");
    cy.contains("Booking reference: booking_789").should("be.visible");
    cy.contains("Traveler: John Doe").should("be.visible");
    cy.contains("Guests: 2").should("be.visible");
    cy.contains("john@example.com").should("be.visible");
  });
});
