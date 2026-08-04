import logo from "#/assets/odissei-logo.png";

export default function Header() {
  return (
    <section
      className="
        overflow-hidden
        bg-white
        p-6
      "
    >
      <div className="flex items-start gap-6 justify-center">
        <img
          src={logo}
          alt="ODISSEI"
          className="
            h-14
            w-auto
            shrink-0
          "
        />

        <div className="max-w-3xl">
          <h1
            className="
              text-3xl
              font-semibold
              tracking-tight
              text-zinc-950
            "
          >
            Welcome to the ODISSEI Portal
          </h1>

          <p
            className="
              mt-4
              text-sm
              leading-5
              text-zinc-600
            "
          >
            The ODISSEI Portal combines metadata from a wide variety of social sciences research
            data repositories into a single interface, allowing for advanced semantic queries to
            support findability and facilitate data access.
          </p>

          <p
            className="
              mt-3
              text-sm
              leading-5
              text-zinc-600
            "
          >
            The Portal includes a link to the Data Access Broker (DAB) through which open datasets
            can be downloaded directly. For restricted access datasets, the DAB links to the
            provider's page for more information.
          </p>
        </div>
      </div>
    </section>
  );
}
