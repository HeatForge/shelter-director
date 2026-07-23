import { ClockIcon } from "lucide-react";
import { Button } from "../ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { useState } from "react";

export default function TimeWidget() {
  const [time, setTime] = useState(new Date());

  const handleWait = (secondsToWait: number) => {
    setTime(prev => new Date(prev.getTime() + secondsToWait * 1000));
  }

  return (
    <div className="flex flex-col size-64  items-center justify-center gap-4 rounded-xl border-2 border-accent">

      {/* TODO: Add an animated clock display with analog alternative in settings */}
      <ClockIcon className="size-22"/>
      <h1 className="text-2xl font-bold">{time.toLocaleTimeString()}</h1>

      <DropdownMenu>
        <DropdownMenuTrigger render={<Button className="w-48">Wait for...</Button>}/>

        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => handleWait(5 * 60)}>5 minutes</DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleWait(10 * 60)}>10 minutes</DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleWait(15 * 60)}>15 minutes</DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleWait(1 * 60 * 60)}>1 hour</DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleWait(2 * 60 * 60)}>2 hours</DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleWait(6 * 60 * 60)}>6 hours</DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleWait(12 * 60 * 60)}>12 hours</DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleWait(24 * 60 * 60)}>24 hours</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )

}