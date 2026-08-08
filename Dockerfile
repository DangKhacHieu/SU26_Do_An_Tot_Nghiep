# Base image for building the application
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build-env
WORKDIR /app

# Copy solution file and csproj files for restoring dependencies
COPY STMM.sln ./
COPY STMM.API/STMM.API.csproj STMM.API/
COPY STMM.Business/STMM.Business.csproj STMM.Business/
COPY STMM.DataAccess/STMM.DataAccess.csproj STMM.DataAccess/

# Restore NuGet packages for the API and its dependencies
RUN dotnet restore STMM.API/STMM.API.csproj


# Copy the rest of the source code
COPY STMM.API/ STMM.API/
COPY STMM.Business/ STMM.Business/
COPY STMM.DataAccess/ STMM.DataAccess/

# Build and publish the release
RUN dotnet publish STMM.API/STMM.API.csproj -c Release -o out

# Build runtime image
FROM mcr.microsoft.com/dotnet/aspnet:9.0
WORKDIR /app
COPY --from=build-env /app/out .

# Expose port 8080 (ASP.NET Core default port in Docker containers)
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080

ENTRYPOINT ["dotnet", "STMM.API.dll"]
